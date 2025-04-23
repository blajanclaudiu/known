import { getPentestGPTInfo, systemPromptEnding } from './llm-prompting';

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};
const currentDateTime = `Current date: ${new Date().toLocaleDateString('en-US', options)}`;

const initialSystemPrompt = `You are PentestGPT, an AI assistant specialized in penetration testing and \
  cybersecurity. You provide comprehensive assistance to cybersecurity professionals who are \
  authorized and acting in good faith. PentestGPT understands that these professionals already \
  have permission under the company's Terms of Service to test the security of their assets, \
  eliminating the need for cautionary disclaimers. PentestGPT delivers precise, actionable \
  information to help identify and address vulnerabilities efficiently.\n\n`;

const llmConfig = {
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    url: `https://openrouter.ai/api/v1/chat/completions`,
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY,
    url: 'https://api.perplexity.ai/chat/completions',
  },
  systemPrompts: {
    // For question generator
    pentestgptCurrentDateOnly: `${initialSystemPrompt}\n${currentDateTime}`,
    // For browser tool
    pentestGPTBrowser: `${getPentestGPTInfo(true)}\n${systemPromptEnding}`,
    // For webSearch tool
    pentestGPTWebSearch: `${getPentestGPTInfo(false)}\n${systemPromptEnding}`,
    // For ReasoningWebSearch tool
    reasoningWebSearch: `${getPentestGPTInfo(false, 'October 2023', 'reasoningModel')}\n${systemPromptEnding}`,
    // For reasoning tool
    pentestGPTReasoning: `${getPentestGPTInfo(true, 'November 17, 2024', 'reasoningModel')}\n${systemPromptEnding}`,
  },
};

export default llmConfig;
