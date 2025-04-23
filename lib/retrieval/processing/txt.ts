import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';

export const processTxt = async (txt: Blob): Promise<FileItemChunk[]> => {
  const fileBuffer = Buffer.from(await txt.arrayBuffer());
  const textDecoder = new TextDecoder('utf-8');
  const textContent = textDecoder.decode(fileBuffer);

  return [
    {
      content: textContent,
      tokens: encode(textContent).length,
    },
  ];
};
