import { supabase } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';

export const uploadFile = async (
  file: File,
  payload: {
    name: string;
    user_id: string;
    file_id: string;
  },
) => {
  const sizeLimitMB = Number.parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT_MB || String(30),
  );
  const MB_TO_BYTES = (mb: number) => mb * 1024 * 1024;
  const SIZE_LIMIT = MB_TO_BYTES(sizeLimitMB);

  if (file.size > SIZE_LIMIT) {
    throw new Error(`File must be less than ${sizeLimitMB}MB`);
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString('base64')}`;

  const { error } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    throw new Error('Error uploading file');
  }

  return filePath;
};

export const deleteFileFromStorage = async (filePath: string) => {
  const { error } = await supabase.storage.from('files').remove([filePath]);

  if (error) {
    toast.error('Failed to remove file!');
    return;
  }
};

export const getFileFromStorage = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(filePath, 60 * 60 * 24); // 24hrs

  if (error) {
    throw new Error('Error downloading file');
  }

  return data.signedUrl;
};
