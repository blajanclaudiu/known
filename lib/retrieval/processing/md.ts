import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';

export const processMarkdown = async (
  markdown: Blob,
  prepend = '',
): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await markdown.arrayBuffer());
  const textDecoder = new TextDecoder('utf-8');
  const textContent = textDecoder.decode(fileBuffer);

  const finalContent =
    prepend + (prepend?.length > 0 ? '\n\n' : '') + textContent;

  return [
    {
      content: finalContent,
      tokens: encode(finalContent).length,
    },
  ];
};
