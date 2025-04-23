import { deleteAll, deleteItem, getItem, putItem } from '../core/indexedDB';
import { STORES } from '../schema/schema';

const clearAll = async () => {
  for (const store of Object.values(STORES)) {
    await deleteAll(store);
  }
};

const getSyncData = async (id: string) => {
  const syncData = await getItem<{ id: string; value: string }>(
    STORES.SYNC_DATA,
    id,
  );
  return syncData?.value;
};

const setSyncData = async (ids: string | string[], value: string) => {
  if (Array.isArray(ids)) {
    for (const id of ids) {
      await putItem(STORES.SYNC_DATA, { id, value });
    }
  } else {
    await putItem(STORES.SYNC_DATA, { id: ids, value });
  }
};

const deleteSyncData = async (id: string) => {
  await deleteItem(STORES.SYNC_DATA, id);
};

export const storage = {
  getSyncData: getSyncData,
  setSyncData: setSyncData,
  deleteSyncData: deleteSyncData,
  clearAll: clearAll,
};
