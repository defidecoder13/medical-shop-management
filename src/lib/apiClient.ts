import { getApiCache, setApiCache, addToSyncQueue, clearAllApiCaches, invalidateApiCaches } from "./localDb";

export const apiClient = {
    /**
     * GET Request wrapper
     */
    async get(url: string, options: RequestInit = {}, onCache?: (data: any) => void) {
        const isOnline = navigator.onLine;


        let networkFinished = false;

        // Instantly return cache to the callback (Stale-While-Revalidate)
        if (onCache) {
            getApiCache(url).then(cachedData => {
                if (cachedData && !networkFinished) onCache(cachedData);
            });
        }

        if (isOnline) {
            try {
                const fetchOptions = {
                    ...options,
                    cache: options.cache || 'no-store'
                };
                const response = await fetch(url, fetchOptions);
                if (!response.ok) throw new Error("Network response was not ok");

                const data = await response.json();
                networkFinished = true;

                // Cache successful GET request
                await setApiCache(url, data);

                return data;
            } catch (error) {
                console.warn(`Network fetch failed for ${url}, falling back to cache.`, error);
            }
        }

        // Offline or Network Failed -> Fallback to Cache
        console.log(`[Offline Read] Attempting to load from cache: ${url}`);
        const cachedData = await getApiCache(url);
        if (cachedData) {
            return cachedData;
        }

        throw new Error(`Offline and no cached data available for ${url}`);
    },

    /**
     * POST Request wrapper
     */
    async post(url: string, body: any, options: RequestInit = {}) {
        return this._mutate(url, "POST", body, options);
    },

    /**
     * PUT Request wrapper
     */
    async put(url: string, body: any, options: RequestInit = {}) {
        return this._mutate(url, "PUT", body, options);
    },

    /**
     * DELETE Request wrapper
     */
    async delete(url: string, body?: any, options: RequestInit = {}) {
        return this._mutate(url, "DELETE", body, options);
    },

    /**
     * Internal Mutation Handler
     */
    async _mutate(
        url: string,
        method: "POST" | "PUT" | "DELETE" | "PATCH",
        body: any,
        options: RequestInit = {}
    ) {
        const isOnline = navigator.onLine;

        // Targeted granular offline cache invalidation
        const invalidationMap: Record<string, string[]> = {
            "/api/inventory": ["/api/inventory", "/api/global-medicines", "/api/dashboard-analytics", "/api/low-stock", "/api/expiry-summary"],
            "/api/billing": ["/api/transactions", "/api/inventory", "/api/global-medicines", "/api/dashboard-analytics"],
            "/api/patients": ["/api/patients"],
            "/api/suppliers": ["/api/suppliers"],
            "/api/purchases": ["/api/purchases", "/api/inventory", "/api/global-medicines", "/api/dashboard-analytics"],
            "/api/settings": ["/api/settings"],
            "/api/returns": ["/api/returns", "/api/inventory", "/api/global-medicines", "/api/dashboard-analytics"],
            "/api/supplier-returns": ["/api/supplier-returns", "/api/inventory", "/api/global-medicines", "/api/dashboard-analytics"]
        };

        let matchedPrefixes: string[] = [];
        for (const [routeKey, prefixes] of Object.entries(invalidationMap)) {
            if (url.startsWith(routeKey)) {
                matchedPrefixes = matchedPrefixes.concat(prefixes);
            }
        }
        
        if (matchedPrefixes.length > 0) {
            await invalidateApiCaches(matchedPrefixes);
        } else {
            // Fallback: invalidate exact route
            await invalidateApiCaches([url]);
        }

        if (isOnline) {
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        ...options.headers,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    ...options,
                });

                if (!response.ok) {
                    // It's a server error, not a network drop
                    if ([502, 503, 504].includes(response.status)) {
                        throw new Error(`Gateway Error ${response.status} - queuing for offline`);
                    }
                    const errorData = await response.json().catch(() => ({}));
                    const err = new Error(errorData.error || `Request failed with status ${response.status}`);
                    (err as any).isBusinessError = true;
                    throw err;
                }

                return await response.json();
            } catch (error: any) {
                if (error.isBusinessError) {
                    throw error; // Throw business errors directly to UI
                }
                console.warn(`[Network Write Failed] Queuing ${method} ${url} for sync.`, error);
            }
        }

        // Offline or Network Failed -> Queue the mutation
        console.log(`[Offline Write] Queuing ${method} operation for ${url}`);
        await addToSyncQueue(url, method, body);

        // Return a mocked success response for optimistic UI updates
        return {
            success: true,
            offlineQueued: true,
            _id: body?._id || `temp-${Date.now()}` // Mock ID for optimistic updates
        };
    }
};
