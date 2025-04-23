-- Add new columns to chats table for tracking updates
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_message_update TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_feedback_update TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_file_update TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create function to update last_message_update in chats
CREATE OR REPLACE FUNCTION update_chat_last_message_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE chats
        SET last_message_update = NOW()
        WHERE id = OLD.chat_id;
        RETURN OLD;
    ELSE
        UPDATE chats
        SET last_message_update = NOW()
        WHERE id = NEW.chat_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update last_feedback_update in chats
CREATE OR REPLACE FUNCTION update_chat_last_feedback_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Join feedback with messages to get the chat_id for deletion
        UPDATE chats
        SET last_feedback_update = NOW()
        FROM messages
        WHERE messages.id = OLD.message_id AND chats.id = messages.chat_id;
        RETURN OLD;
    ELSE
        -- Join feedback with messages to get the chat_id
        UPDATE chats
        SET last_feedback_update = NOW()
        FROM messages
        WHERE messages.id = NEW.message_id AND chats.id = messages.chat_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update last_file_update in chats
CREATE OR REPLACE FUNCTION update_chat_last_file_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.chat_id IS NOT NULL THEN
            UPDATE chats
            SET last_file_update = NOW()
            WHERE id = OLD.chat_id;
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.chat_id IS NOT NULL THEN
            UPDATE chats
            SET last_file_update = NOW()
            WHERE id = NEW.chat_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on messages table
CREATE TRIGGER update_chat_message_timestamp
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_message_update();

-- Create triggers on feedback table
CREATE TRIGGER update_chat_feedback_timestamp
AFTER INSERT OR UPDATE OR DELETE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_feedback_update();

-- Create triggers on files table
CREATE TRIGGER update_chat_file_timestamp
AFTER INSERT OR UPDATE OR DELETE ON files
FOR EACH ROW
EXECUTE FUNCTION update_chat_last_file_update();

-- Note: With DEFAULT NOW() and NOT NULL constraints, the columns are already populated
-- for existing records. No additional update statements needed.
