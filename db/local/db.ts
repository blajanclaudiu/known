import { chats } from './objects/chats';
import { feedback } from './objects/feedback';
import { fileItems } from './objects/fileItems';
import { files } from './objects/files';
import { messageFileItems } from './objects/messageFileItem';
import { messageImages } from './objects/messageImages';
import { messages } from './objects/messages';
import { storage } from './objects/storage';

// Create an organized database interface object
export const localDB = {
  // General storage functions
  storage: storage,

  // Chat related functions
  chats: chats,

  // Message related functions
  messages: messages,

  // File related functions
  files: files,

  // File items related functions
  fileItems: fileItems,

  // Feedback related functions
  feedback: feedback,

  // Message-FileItem junction related functions
  messageFileItems: messageFileItems,

  // Message images related functions
  messageImages: messageImages,
};
