// IndexedDB setup
const DB_NAME = 'pentest_gpt_db';
const DB_VERSION = 9;

const STORES = {
  CHATS: 'chats',
  MESSAGES: 'messages',
  FILE_ITEMS: 'fileItems',
  FEEDBACK: 'feedback',
  FILES: 'files',
  MESSAGE_FILE_ITEMS: 'messageFileItems',
  MESSAGE_IMAGES: 'messageImages',
  SYNC_DATA: 'syncData',
};

// Initialize database
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(`IndexedDB error: ${(event.target as IDBOpenDBRequest).error}`);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = request.transaction as IDBTransaction;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatsStore = db.createObjectStore(STORES.CHATS, {
          keyPath: 'id',
        });
        chatsStore.createIndex('user_id', 'user_id', { unique: false });
      } else if (transaction) {
        const chatsStore = transaction.objectStore(STORES.CHATS);
        if (!chatsStore.indexNames.contains('user_id')) {
          chatsStore.createIndex('user_id', 'user_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, {
          keyPath: 'id',
        });
        messagesStore.createIndex('chat_id', 'chat_id', { unique: false });
      } else if (transaction) {
        const messagesStore = transaction.objectStore(STORES.MESSAGES);
        if (!messagesStore.indexNames.contains('chat_id')) {
          messagesStore.createIndex('chat_id', 'chat_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.FILE_ITEMS)) {
        const fileItemsStore = db.createObjectStore(STORES.FILE_ITEMS, {
          keyPath: 'id',
        });
        fileItemsStore.createIndex('file_id', 'file_id', { unique: false });
      } else if (transaction) {
        const fileItemsStore = transaction.objectStore(STORES.FILE_ITEMS);
        if (!fileItemsStore.indexNames.contains('file_id')) {
          fileItemsStore.createIndex('file_id', 'file_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.FEEDBACK)) {
        const feedbackStore = db.createObjectStore(STORES.FEEDBACK, {
          keyPath: 'id',
        });
        feedbackStore.createIndex('message_id', 'message_id', {
          unique: false,
        });
        feedbackStore.createIndex('chat_id', 'chat_id', { unique: false });
      } else if (transaction) {
        const feedbackStore = transaction.objectStore(STORES.FEEDBACK);
        if (!feedbackStore.indexNames.contains('message_id')) {
          feedbackStore.createIndex('message_id', 'message_id', {
            unique: false,
          });
        }
        if (!feedbackStore.indexNames.contains('chat_id')) {
          feedbackStore.createIndex('chat_id', 'chat_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.FILES)) {
        const filesStore = db.createObjectStore(STORES.FILES, {
          keyPath: 'id',
        });
        filesStore.createIndex('user_id', 'user_id', { unique: false });
        filesStore.createIndex('chat_id', 'chat_id', { unique: false });
        filesStore.createIndex('message_id', 'message_id', { unique: false });
        filesStore.createIndex('id', 'id', { unique: true });
      } else if (transaction) {
        const filesStore = transaction.objectStore(STORES.FILES);
        if (!filesStore.indexNames.contains('chat_id')) {
          filesStore.createIndex('chat_id', 'chat_id', { unique: false });
        }
        if (!filesStore.indexNames.contains('message_id')) {
          filesStore.createIndex('message_id', 'message_id', { unique: false });
        }
        if (!filesStore.indexNames.contains('id')) {
          filesStore.createIndex('id', 'id', { unique: true });
        }
        if (!filesStore.indexNames.contains('user_id')) {
          filesStore.createIndex('user_id', 'user_id', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGE_FILE_ITEMS)) {
        const messageFileItemsStore = db.createObjectStore(
          STORES.MESSAGE_FILE_ITEMS,
          { keyPath: ['message_id', 'file_item_id'] },
        );
        messageFileItemsStore.createIndex('message_id', 'message_id', {
          unique: false,
        });
        messageFileItemsStore.createIndex('file_item_id', 'file_item_id', {
          unique: false,
        });
      } else if (transaction) {
        const messageFileItemsStore = transaction.objectStore(
          STORES.MESSAGE_FILE_ITEMS,
        );
        if (!messageFileItemsStore.indexNames.contains('message_id')) {
          messageFileItemsStore.createIndex('message_id', 'message_id', {
            unique: false,
          });
        }
        if (!messageFileItemsStore.indexNames.contains('file_item_id')) {
          messageFileItemsStore.createIndex('file_item_id', 'file_item_id', {
            unique: false,
          });
        }
      }

      // Create MessageImages store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.MESSAGE_IMAGES)) {
        const messageImagesStore = db.createObjectStore(STORES.MESSAGE_IMAGES, {
          keyPath: 'path', // Use image path as the key
        });
        messageImagesStore.createIndex('message_id', 'message_id', {
          unique: false,
        });
        messageImagesStore.createIndex('path', 'path', { unique: true });
      } else if (transaction) {
        const messageImagesStore = transaction.objectStore(
          STORES.MESSAGE_IMAGES,
        );
        if (!messageImagesStore.indexNames.contains('message_id')) {
          messageImagesStore.createIndex('message_id', 'message_id', {
            unique: false,
          });
        }
        if (!messageImagesStore.indexNames.contains('path')) {
          messageImagesStore.createIndex('path', 'path', { unique: true });
        }
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_DATA)) {
        db.createObjectStore(STORES.SYNC_DATA, {
          keyPath: 'id',
        });
      }

      console.log('IndexedDB upgraded to version', DB_VERSION);
    };
  });
};

export { initDB, STORES };
