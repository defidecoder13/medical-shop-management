import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "medishop_offline_db";
const DB_VERSION = 1;

interface MedishopDB extends DBSchema {
    apiCache: {
        key: string;
        value: {
            url: string;
            data: any;
            timestamp: number;
        };
    };
    syncQueue: {
        key: string;
        value: {
            id: string; // Unique ID (e.g., UUID or timestamp)
            url: string;
            method: "POST" | "PUT" | "DELETE" | "PATCH";
            body: any;
            timestamp: number;
        };
    };
}

let dbPromise: Promise<IDBPDatabase<MedishopDB>> | null = null;

// Ensure this only runs on the client-side
if (typeof window !== "undefined") {
    dbPromise = openDB<MedishopDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("apiCache")) {
                db.createObjectStore("apiCache", { keyPath: "url" });
            }
            if (!db.objectStoreNames.contains("syncQueue")) {
                db.createObjectStore("syncQueue", { keyPath: "id" });
            }
        },
    });
}

/**
 * Save API Response to apiCache
 */
export async function setApiCache(url: string, data: any) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.put("apiCache", {
        url,
        data,
        timestamp: Date.now(),
    });
}

/**
 * Get cached API Response
 */
export async function getApiCache(url: string) {
    if (!dbPromise) return null;
    const db = await dbPromise;
    const cached = await db.get("apiCache", url);
    return cached ? cached.data : null;
}

/**
 * Clear specific API cache (Useful when navigating away or forcing a refresh)
 */
export async function clearApiCache(url: string) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete("apiCache", url);
}

/**
 * Add a mutation to the Sync Queue
 */
export async function addToSyncQueue(
    url: string,
    method: "POST" | "PUT" | "DELETE" | "PATCH",
    body: any
) {
    if (!dbPromise) return;
    const db = await dbPromise;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.put("syncQueue", {
        id,
        url,
        method,
        body,
        timestamp: Date.now(),
    });
}

/**
 * Get all queued mutations
 */
export async function getSyncQueue() {
    if (!dbPromise) return [];
    const db = await dbPromise;
    return await db.getAll("syncQueue");
}

/**
 * Remove a mutation from the Sync Queue (called after successful sync)
 */
export async function removeFromSyncQueue(id: string) {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete("syncQueue", id);
}

/**
 * Process Sync Queue - to be called when coming back online
 */
export async function processSyncQueue(
    onSuccess?: (item: any) => void,
    onError?: (error: any, item: any) => void
) {
    if (!dbPromise || !navigator.onLine) return;

    const queue = await getSyncQueue();
    // Sort oldest to newest
    queue.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of queue) {
        try {
            const response = await fetch(item.url, {
                method: item.method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(item.body),
            });

            if (!response.ok) {
                let errText = "";
                try {
                    errText = await response.text();
                } catch (e) {
                    errText = "Could not parse response";
                }
                console.error(`Sync error detail for ${item.url}:`, errText);

                // If it's a client error (4xx) or a business logic error (500, 501) that isn't a gateway/timeout issue, 
                // it means the server processed it and rejected it permanently. Retrying won't help.
                if (response.status >= 400 && response.status <= 501 && ![408, 429].includes(response.status)) {
                    console.warn(`Sync item ${item.id} permanently rejected by server (Status ${response.status}). Discarding from queue to prevent loop.`);
                    await removeFromSyncQueue(item.id);
                    if (onError) onError(new Error(errText), item);
                    continue; // Skip to next item in queue
                }

                // If it's a network gateway error or timeout, we throw to retry later.
                throw new Error(`Sync failed with status: ${response.status}. Details: ${errText}`);
            }

            await removeFromSyncQueue(item.id);
            if (onSuccess) onSuccess(item);
        } catch (error) {
            console.error(`Failed to sync operation ${item.id}:`, error);
            if (onError) onError(error, item);
            // Stop processing queue strictly if one fails to preserve order logic (or could be debated based on business rules)
            break;
        }
    }
}
