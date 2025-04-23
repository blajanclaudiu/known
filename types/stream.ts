export interface DataPartValue {
  citations?: string[];
  ragUsed?: boolean;
  ragId?: string | null;
  type?: string;
  content?: string;
  finishReason?: string;
  sandboxType?: 'persistent-sandbox' | 'temporary-sandbox';
  elapsed_secs?: number;
  chatTitle?: string | null;
}
