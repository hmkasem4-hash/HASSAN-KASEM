import { ArchivedJudgment, CourtCase, LegalDocument } from '../types';
import { INITIAL_CASES } from '../data/initialCases';
import { INITIAL_JUDGMENTS } from '../data/initialJudgments';
import { INITIAL_LEGAL_LIBRARY } from '../data/initialLegalLibrary';

const DB_NAME = 'hk_law_storage_db';
const DB_VERSION = 1;
const STORE_CASES = 'cases';
const STORE_JUDGMENTS = 'judgments';
const STORE_LEGAL_DOCS = 'legal_documents';

// System initialization flag - once initialized, deletions and uploaded files are 100% authoritative
export const SYSTEM_INITIALIZED_KEY = 'court_system_data_initialized_v2';

export function isSystemInitialized(): boolean {
  try {
    return localStorage.getItem(SYSTEM_INITIALIZED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSystemInitialized(): void {
  try {
    localStorage.setItem(SYSTEM_INITIALIZED_KEY, 'true');
  } catch {
    // ignore
  }
}

// Helper to open IndexedDB with fallback
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CASES)) {
        db.createObjectStore(STORE_CASES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_JUDGMENTS)) {
        db.createObjectStore(STORE_JUDGMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_LEGAL_DOCS)) {
        db.createObjectStore(STORE_LEGAL_DOCS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Generic IndexedDB Put All
async function putAll<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Clear old records in the store to match state accurately
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        items.forEach((item) => {
          store.put(item);
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[persistentStorage] Failed to save to IndexedDB (${storeName}):`, err);
  }
}

// Generic IndexedDB Get All
async function getAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[persistentStorage] Failed to read from IndexedDB (${storeName}):`, err);
    return [];
  }
}

// -------------------------------------------------------------
// JUDGMENTS STORAGE & PRESERVATION
// -------------------------------------------------------------
const JUDGMENTS_STORAGE_KEY = 'court_archived_judgments_v1';

export async function saveJudgmentsToStorage(judgments: ArchivedJudgment[]): Promise<void> {
  markSystemInitialized();

  // 1. Always save to IndexedDB (supports unlimited storage for large PDFs, scanned deeds & Word docs)
  await putAll(STORE_JUDGMENTS, judgments);

  // 2. Also save to localStorage as quick synchronous cache
  try {
    localStorage.setItem(JUDGMENTS_STORAGE_KEY, JSON.stringify(judgments));
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage quota exceeded for judgments, relying on IndexedDB:', e);
    // If quota exceeded, store metadata-only version in localStorage so fast startup remains intact
    try {
      const lightweight = judgments.map(j => ({
        ...j,
        fileAttachment: j.fileAttachment ? {
          id: j.fileAttachment.id,
          name: j.fileAttachment.name,
          size: j.fileAttachment.size,
          type: j.fileAttachment.type,
          dataUrl: '', // omitted in localStorage to save space, preserved in IndexedDB
          uploadedAt: j.fileAttachment.uploadedAt
        } : undefined
      }));
      localStorage.setItem(JUDGMENTS_STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // ignore
    }
  }
}

export async function loadJudgmentsFromStorage(): Promise<ArchivedJudgment[]> {
  // 1. Try IndexedDB first (contains complete full-resolution files and deeds)
  try {
    const dbItems = await getAll<ArchivedJudgment>(STORE_JUDGMENTS);
    if (dbItems && dbItems.length > 0) {
      markSystemInitialized();
      return dbItems;
    }
  } catch (e) {
    console.warn('[persistentStorage] IndexedDB read failed for judgments:', e);
  }

  // 2. Fallback to localStorage
  try {
    const saved = localStorage.getItem(JUDGMENTS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        markSystemInitialized();
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage read failed for judgments:', e);
  }

  // 3. If system has already been initialized previously, respect current state (do not re-inject deleted items)
  if (isSystemInitialized()) {
    return [];
  }

  // 4. Very first initial boot: seed default judgments and persist them
  markSystemInitialized();
  saveJudgmentsToStorage(INITIAL_JUDGMENTS).catch(() => {});
  return INITIAL_JUDGMENTS;
}

// -------------------------------------------------------------
// CASES STORAGE & PRESERVATION
// -------------------------------------------------------------
const CASES_STORAGE_KEY = 'court_hearings_cases_v2';

export async function saveCasesToStorage(cases: CourtCase[]): Promise<void> {
  markSystemInitialized();

  // 1. IndexedDB
  await putAll(STORE_CASES, cases);

  // 2. LocalStorage
  try {
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage quota exceeded for cases:', e);
  }
}

export async function loadCasesFromStorage(): Promise<CourtCase[]> {
  // 1. Try IndexedDB first
  try {
    const dbItems = await getAll<CourtCase>(STORE_CASES);
    if (dbItems && dbItems.length > 0) {
      markSystemInitialized();
      return dbItems;
    }
  } catch (e) {
    console.warn('[persistentStorage] IndexedDB read failed for cases:', e);
  }

  // 2. Try localStorage
  try {
    const saved = localStorage.getItem(CASES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        markSystemInitialized();
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage read failed for cases:', e);
  }

  // 3. If system was already initialized, respect that the user may have deleted cases (never re-add them)
  if (isSystemInitialized()) {
    return [];
  }

  // 4. Very first initial boot: seed default cases and persist them
  markSystemInitialized();
  saveCasesToStorage(INITIAL_CASES).catch(() => {});
  return INITIAL_CASES;
}

// -------------------------------------------------------------
// LEGAL LIBRARY STORAGE
// -------------------------------------------------------------
const LEGAL_LIBRARY_STORAGE_KEY = 'court_legal_library_v1';

export async function saveLegalDocsToStorage(docs: LegalDocument[]): Promise<void> {
  markSystemInitialized();
  await putAll(STORE_LEGAL_DOCS, docs);
  try {
    localStorage.setItem(LEGAL_LIBRARY_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage quota exceeded for legal library:', e);
  }
}

export async function loadLegalDocsFromStorage(): Promise<LegalDocument[]> {
  try {
    const dbItems = await getAll<LegalDocument>(STORE_LEGAL_DOCS);
    if (dbItems && dbItems.length > 0) {
      markSystemInitialized();
      return dbItems;
    }
  } catch (e) {
    console.warn('[persistentStorage] IndexedDB read failed for legal docs:', e);
  }

  try {
    const saved = localStorage.getItem(LEGAL_LIBRARY_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        markSystemInitialized();
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[persistentStorage] LocalStorage read failed for legal docs:', e);
  }

  if (isSystemInitialized()) {
    return [];
  }

  markSystemInitialized();
  saveLegalDocsToStorage(INITIAL_LEGAL_LIBRARY).catch(() => {});
  return INITIAL_LEGAL_LIBRARY;
}

