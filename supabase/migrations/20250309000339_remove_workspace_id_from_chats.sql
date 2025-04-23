-- Migration to remove workspace_id from chats table

-- First, drop the index on workspace_id
DROP INDEX IF EXISTS idx_chats_workspace_id;

-- Remove the foreign key constraint
ALTER TABLE chats
DROP CONSTRAINT IF EXISTS chats_workspace_id_fkey;

-- Remove the workspace_id column
ALTER TABLE chats
DROP COLUMN IF EXISTS workspace_id;