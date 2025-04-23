import type { LLM } from '@/types';

export const SmallModel: LLM = {
  modelId: 'mistral-medium',
  modelName: 'Small Model',
  shortModelName: 'Small',
  provider: 'hackerai',
  imageInput: true,
};

export const LargeModel: LLM = {
  modelId: 'mistral-large',
  modelName: 'Large Model',
  shortModelName: 'Large',
  provider: 'hackerai',
  imageInput: true,
};

export const HACKERAI_LLM_LIST: LLM[] = [SmallModel, LargeModel];
