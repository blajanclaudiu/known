-- Add message_id and chat_id columns to files table
ALTER TABLE files
ADD COLUMN message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
ADD COLUMN chat_id UUID REFERENCES chats(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_files_message_id ON files(message_id);
CREATE INDEX idx_files_chat_id ON files(chat_id);

-- Drop duplicated function
DROP FUNCTION IF EXISTS delete_message_including_and_after;