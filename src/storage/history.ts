import type { HistoryRepository, TestResult } from "./types";

const DATABASE = "typekor";
const STORE = "results";
const VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("startedAt", "startedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class IndexedDbHistoryRepository implements HistoryRepository {
  async list(): Promise<TestResult[]> {
    const database = await openDatabase();
    return new Promise<TestResult[]>((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () =>
        resolve(
          (request.result as TestResult[]).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
        );
      request.onerror = () => reject(request.error);
    }).finally(() => database.close());
  }

  async save(result: TestResult): Promise<void> {
    const database = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(result);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => database.close());
  }

  async clear(): Promise<void> {
    const database = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => database.close());
  }
}

export const historyRepository: HistoryRepository = new IndexedDbHistoryRepository();
