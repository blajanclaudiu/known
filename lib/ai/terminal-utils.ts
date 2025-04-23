import { encode, decode } from 'gpt-tokenizer';

const STREAM_MAX_TOKENS = 2048;
const AGENT_MAX_TOKENS = 32000;

export async function streamTerminalOutput(
  terminalStream: ReadableStream<Uint8Array>,
  dataStream: any,
): Promise<string> {
  const reader = terminalStream.getReader();
  let terminalOutput = '';
  let truncationMessageSent = false;
  let currentTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const newTokens = encode(chunk).length;

    // Always add to full output
    terminalOutput += chunk;

    // Only truncate UI display
    if (currentTokens >= STREAM_MAX_TOKENS) {
      if (!truncationMessageSent) {
        dataStream.writeData({
          type: 'text-delta',
          content: '...\n\n[Output truncated because too long]\n```',
        });
        truncationMessageSent = true;
      }
      continue;
    }

    const remainingTokens = STREAM_MAX_TOKENS - currentTokens;
    if (newTokens > remainingTokens) {
      // Truncate the chunk to fit within remaining tokens for UI
      const tokens = encode(chunk);
      const truncatedTokens = tokens.slice(0, remainingTokens);
      const truncatedChunk = decode(truncatedTokens);

      dataStream.writeData({
        type: 'text-delta',
        content: truncatedChunk,
      });
      currentTokens += truncatedTokens.length;

      if (!truncationMessageSent) {
        dataStream.writeData({
          type: 'text-delta',
          content: '...\n\n[Output truncated because too long]\n```',
        });
        truncationMessageSent = true;
      }
    } else {
      dataStream.writeData({
        type: 'text-delta',
        content: chunk,
      });
      currentTokens += newTokens;
    }
  }

  // Truncate the final output if it exceeds AGENT_MAX_TOKENS
  const tokens = encode(terminalOutput);
  if (tokens.length > AGENT_MAX_TOKENS) {
    const truncatedTokens = tokens.slice(0, AGENT_MAX_TOKENS);
    terminalOutput = `${decode(truncatedTokens)}\n\n[Output truncated because too long]`;
  }

  return terminalOutput;
}

export function truncateContentByTokens(
  output: string,
  maxTokens: number = AGENT_MAX_TOKENS,
): string {
  const tokens = encode(output);
  if (tokens.length > maxTokens) {
    const initial = tokens.slice(0, maxTokens);
    return `${decode(initial)}...\n\n[Output truncated because too long]\n\`\`\``;
  }
  return output;
}
