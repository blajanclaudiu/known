import { initDB } from '../schema/schema';

// Helper functions for database operations
const getObjectStore = async (
  storeName: string,
  mode: IDBTransactionMode = 'readonly',
): Promise<IDBObjectStore> => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

const getItem = async <T>(
  storeName: string,
  key: string,
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    try {
      getObjectStore(storeName)
        .then((store) => {
          const request = store.get(key);

          request.onsuccess = () => {
            resolve(request.result as T);
          };

          request.onerror = () => {
            reject(request.error);
          };
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      getObjectStore(storeName, 'readwrite')
        .then((store) => {
          const request = store.put(item);

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = () => {
            reject(request.error);
          };
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

const deleteItem = async (
  storeName: string,
  key: string | [string, string],
): Promise<void> => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const deleteAll = async (storeName: string): Promise<void> => {
  const store = await getObjectStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

const getItemsByIndex = async <T>(
  storeName: string,
  indexName: string,
  key: string,
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    try {
      getObjectStore(storeName)
        .then((store) => {
          const index = store.index(indexName);
          const request = index.getAll(key);

          request.onsuccess = () => {
            resolve(request.result as T[]);
          };

          request.onerror = () => {
            reject(request.error);
          };
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

export {
  getObjectStore,
  getItem,
  putItem,
  deleteItem,
  getItemsByIndex,
  deleteAll,
};
