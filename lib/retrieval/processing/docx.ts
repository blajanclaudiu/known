import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';

export const processDocX = async (text: string): Promise<FileItemChunk[]> => {
  return [
    {
      content: text,
      tokens: encode(text).length,
    },
  ];
};
