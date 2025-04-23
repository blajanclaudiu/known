-- Migrate data from message_file_items and chat_files to files
update files set message_id = (select mfi.message_id from message_file_items mfi join file_items fi on mfi.file_item_id = fi.id and fi.file_id = files.id limit 1) where message_id is null;
update files set chat_id = (select m.chat_id from messages m where m.id = files.message_id limit 1) where chat_id is null;
update files set chat_id = (select cf.chat_id from chat_files cf where cf.file_id = files.id limit 1) where chat_id is null;