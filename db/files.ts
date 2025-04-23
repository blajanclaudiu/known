import { supabase } from '@/lib/supabase/browser-client';
import type { Tables, TablesInsert, TablesUpdate } from '@/supabase/types';
import mammoth from 'mammoth';
import { toast } from 'sonner';
import { uploadFile } from './storage/files';
import { localDB } from './local/db';

export const getFileById = async (fileId: string, useStored = true) => {
  const storedFile = await localDB.files.getById(fileId);
  if (useStored && storedFile) {
    return storedFile;
  }

  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (!file) {
    throw new Error(error.message);
  }

  await localDB.files.update(file);

  return file;
};

export const getAllFilesCount = async (userId: string) => {
  const storedFilesCount = await localDB.files.getCount(userId);
  if (storedFilesCount) {
    return storedFilesCount;
  }

  const { count, error } = await supabase
    .from('files')
    .select('*', { count: 'exact' });

  if (error) {
    throw new Error(error.message);
  }

  return count;
};

export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  const fileExtension = file.name.split('.').pop();

  // console.log("fileExtension", fileExtension)

  if (fileExtension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({
      arrayBuffer,
    });

    return createDocXFile(result.value, file, fileRecord);
  } else {
    return createFile(file, fileRecord);
  }
};

// For non-docx files
export const createFile = async (
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  let validFilename = fileRecord.name
    .replace(/[^a-z0-9.]/gi, '_')
    .toLowerCase();
  const extension = validFilename.split('.').pop();
  const baseName = validFilename.substring(0, validFilename.lastIndexOf('.'));
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1;
  if (baseName.length > maxBaseNameLength) {
    validFilename = `${baseName.substring(0, maxBaseNameLength)}.${extension}`;
  }
  fileRecord.name = validFilename;

  const filesCounts = (await getAllFilesCount(fileRecord.user_id)) || 0;
  const maxFiles = Number.parseInt(
    process.env.NEXT_PUBLIC_RATELIMITER_LIMIT_FILES || '100',
  );

  if (filesCounts >= maxFiles) return false;

  const { data: createdFile, error } = await supabase
    .from('files')
    .insert([fileRecord])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  await localDB.files.update(createdFile);

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name,
  });

  await updateFile(createdFile.id, {
    file_path: filePath,
  });

  const formData = new FormData();
  formData.append('file_id', createdFile.id);

  const response = await fetch('/api/retrieval/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const jsonText = await response.text();
    const json = JSON.parse(jsonText);
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`,
    );
    await deleteFile(createdFile.id);
    await localDB.files.delete(createdFile.id);
    throw new Error(
      `Failed to process file (${fileRecord.name}): ${json.message}`,
    );
  }

  const fetchedFile = await getFileById(createdFile.id, false);

  // for the cache
  await getFileItemsByFileId(createdFile.id, false);

  return fetchedFile;
};

// // Handle docx files
export const createDocXFile = async (
  text: string,
  file: File,
  fileRecord: TablesInsert<'files'>,
) => {
  const filesCounts = (await getAllFilesCount(fileRecord.user_id)) || 0;
  const maxFiles = Number.parseInt(
    process.env.NEXT_PUBLIC_RATELIMITER_LIMIT_FILES || '100',
  );

  if (filesCounts >= maxFiles) return false;

  const { data: createdFile, error } = await supabase
    .from('files')
    .insert([fileRecord])
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  await localDB.files.update(createdFile);

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name,
  });

  await updateFile(createdFile.id, {
    file_path: filePath,
  });

  const response = await fetch('/api/retrieval/process/docx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      fileId: createdFile.id,
      fileExtension: 'docx',
    }),
  });

  if (!response.ok) {
    toast.error('Failed to process file.');
    const jsonText = await response.text();
    const json = JSON.parse(jsonText);
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`,
    );
    toast.error(`Failed to process file. Reason:${json.message}`, {
      duration: 10000,
    });
    await deleteFile(createdFile.id);
  }

  const fetchedFile = await getFileById(createdFile.id);
  // for the cache
  await getFileItemsByFileId(createdFile.id, false);

  return fetchedFile;
};

export const updateFile = async (
  fileId: string,
  file: TablesUpdate<'files'>,
) => {
  const { data: updatedFile, error } = await supabase
    .from('files')
    .update(file)
    .eq('id', fileId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await localDB.files.update(updatedFile);

  return updatedFile;
};

export const deleteFile = async (fileId: string) => {
  const { error } = await supabase.from('files').delete().eq('id', fileId);

  if (error) {
    throw new Error(error.message);
  }

  await localDB.files.delete(fileId);

  return true;
};

export const getFileItemsByFileIds = async (fileIds: string[]) => {
  if (!fileIds.length) return [];

  const returnData: Tables<'file_items'>[] = [];

  for (const fileId of fileIds) {
    const storedFileItems = await localDB.fileItems.getByFileId(fileId);
    if (storedFileItems) {
      returnData.push(...storedFileItems);
    }
  }
  const { data, error } = await supabase
    .from('file_items')
    .select('*')
    .in(
      'file_id',
      fileIds.filter(
        (fileId) => !returnData.some((item) => item.file_id === fileId),
      ),
    );

  if (error) {
    throw new Error(error.message);
  }

  if (data?.length > 0) {
    await localDB.fileItems.updateMany(data);
    returnData.push(...data);
  }

  return returnData;
};

export const getFileItemsByFileId = async (
  fileId: string,
  useStored = true,
) => {
  const storedFileItems = await localDB.fileItems.getByFileId(
    fileId,
    'sequence_number',
  );
  if (useStored && storedFileItems) {
    return storedFileItems;
  }

  const { data, error } = await supabase
    .from('file_items')
    .select('*')
    .eq('file_id', fileId)
    .order('sequence_number', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  await localDB.fileItems.updateMany(data);

  return data || [];
};
