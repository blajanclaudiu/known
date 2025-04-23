import type { FileItemChunk } from '@/types';
import { encode } from 'gpt-tokenizer';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

export const processPdf = async (pdf: Blob): Promise<FileItemChunk[]> => {
  const loader = new PDFLoader(pdf);
  const docs = await loader.load();
  const completeText = docs.map((doc: any) => doc.pageContent).join(' ');

  return [
    {
      content: completeText,
      tokens: encode(completeText).length,
    },
  ];
};
