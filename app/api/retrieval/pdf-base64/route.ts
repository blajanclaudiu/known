import { getServerProfile } from '@/lib/server/server-chat-helpers';
import { createSupabaseAdminClient } from '@/lib/server/server-utils';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const profile = await getServerProfile();
    const { file_id } = await req.json();

    if (!file_id) {
      return new Response(JSON.stringify({ message: 'File ID is required' }), {
        status: 400,
      });
    }

    // Get file metadata
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
      return new Response(JSON.stringify({ message: 'File not found' }), {
        status: 404,
      });
    }

    // Check authorization
    if (fileMetadata.user_id !== profile.user_id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 403,
      });
    }

    // Download the file
    const { data: file, error: fileError } = await supabaseAdmin.storage
      .from('files')
      .download(fileMetadata.file_path);

    if (fileError) {
      throw new Error(`Failed to retrieve file: ${fileError.message}`);
    }

    // Convert to base64
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');

    return NextResponse.json({
      base64: base64String,
      name: fileMetadata.name,
    });
  } catch (error: any) {
    console.error(`Error in pdf-base64: ${error.stack}`);
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorCode = error.status || 500;
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
    });
  }
}
