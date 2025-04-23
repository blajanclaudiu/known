import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';

export const processCSV = async (csv: Blob): Promise<FileItemChunk[]> => {
  const loader = new CSVLoader(csv);
  const docs = await loader.load();
  const completeText = docs.map((doc) => doc.pageContent).join(' ');

  return [
    {
      content: completeText,
      tokens: encode(completeText).length,
    },
  ];
};
