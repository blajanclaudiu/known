import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';
import { JSONLoader } from 'langchain/document_loaders/fs/json';

export const processJSON = async (json: Blob): Promise<FileItemChunk[]> => {
  const loader = new JSONLoader(json);
  const docs = await loader.load();
  const completeText = docs.map((doc) => doc.pageContent).join(' ');

  return [
    {
      content: completeText,
      tokens: encode(completeText).length,
    },
  ];
};
