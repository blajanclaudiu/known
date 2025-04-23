import {
  processCSV,
  processJSON,
  processMarkdown,
  processPdf,
  processTxt,
  convert,
  TOKEN_LIMIT,
} from '@/lib/retrieval/processing';
import { getServerProfile } from '@/lib/server/server-chat-helpers';
import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import type { FileItemChunk } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const profile = await getServerProfile();

    const formData = await req.formData();

    const file_id = formData.get('file_id') as string;

    const { data: fileMetadata, error: metadataError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', file_id)
      .single();

    if (metadataError) {
      throw new Error(
        `Failed to retrieve file metadata: ${metadataError.message}`,
      );
    }

    if (!fileMetadata) {
      throw new Error('File not found');
    }

    if (fileMetadata.user_id !== profile.user_id) {
      throw new Error('Unauthorized');
    }

    const { data: file, error: fileError } = await supabaseAdmin.storage
      .from('files')
      .download(fileMetadata.file_path);

    if (fileError)
      throw new Error(`Failed to retrieve file: ${fileError.message}`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([fileBuffer]);
    const fileExtension = fileMetadata.name.split('.').pop()?.toLowerCase();

    let chunks: FileItemChunk[] = [];

    switch (fileExtension) {
      case 'csv':
        chunks = await processCSV(blob);
        break;
      case 'json':
        chunks = await processJSON(blob);
        break;
      case 'md':
        chunks = await processMarkdown(blob);
        break;
      case 'pdf':
        chunks = await processPdf(blob);
        break;
      case 'txt':
        chunks = await processTxt(blob);
        break;
      default: {
        const cleanText = await convert(blob);
        chunks = await processTxt(new Blob([cleanText]));
        break;
      }
    }

    if (fileExtension !== 'pdf') {
      chunks = chunks.filter((chunk) => chunk.content.trim() !== '');
    }

    if (chunks.length === 0) {
      throw new Error('Empty file. Please check the file format and content.');
    }

    const totalTokens = chunks.reduce((acc, chunk) => acc + chunk.tokens, 0);
    if (totalTokens > TOKEN_LIMIT) {
      throw new Error(`File content exceeds token limit of ${TOKEN_LIMIT}`);
    }

    const file_items = chunks.map((chunk) => ({
      file_id,
      user_id: profile.user_id,
      sequence_number: 0,
      content: chunk.content,
      tokens: chunk.tokens,
      name: fileMetadata.name,
      openai_embedding: null,
    }));

    await supabaseAdmin.from('file_items').upsert(file_items);

    await supabaseAdmin
      .from('files')
      .update({ tokens: totalTokens })
      .eq('id', file_id);

    return new NextResponse('File processing successful', {
      status: 200,
    });
  } catch (error: any) {
    console.error(`Error in retrieval/process: ${error.stack}`);
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}
