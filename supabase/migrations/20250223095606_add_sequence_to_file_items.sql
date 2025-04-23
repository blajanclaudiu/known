ALTER TABLE file_items ADD COLUMN sequence_number INTEGER;

-- Update existing rows to have sequence numbers based on creation order
WITH numbered_items AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY file_id ORDER BY created_at) - 1 as seq
  FROM file_items
)
UPDATE file_items
SET sequence_number = numbered_items.seq
FROM numbered_items
WHERE file_items.id = numbered_items.id;

-- Make sequence_number NOT NULL after populating existing rows
ALTER TABLE file_items ALTER COLUMN sequence_number SET NOT NULL;

-- Add index on sequence_number and file_id for efficient ordering
CREATE INDEX file_items_sequence_number_idx ON file_items(file_id, sequence_number);
