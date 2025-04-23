-- Create function to clean up temporary files
CREATE OR REPLACE FUNCTION clean_up_temp_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete files that:
    -- 1. Have no associated message_id and chat_id
    -- 2. Were created more than 24 hours ago
    DELETE FROM files
    WHERE message_id IS NULL 
    AND chat_id IS NULL
    AND created_at > (NOW() - INTERVAL '48 hours')
    AND created_at < (NOW() - INTERVAL '24 hours');
END;
$$;

-- Create a scheduled job to run the cleanup function every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'cleanup-temp-files', -- name of the cron job
    '0 * * * *',         -- run every hour (at minute 0)
    $$SELECT clean_up_temp_files()$$
);
