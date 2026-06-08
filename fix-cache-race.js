const fs = require('fs');

let apiClient = fs.readFileSync('src/lib/apiClient.ts', 'utf8');

// Remove from GET
apiClient = apiClient.replace(`        // Invalidate ALL offline GET caches on any mutation so stale data isn't loaded
        await clearAllApiCaches();`, '');

// Add to _mutate
if (!apiClient.includes('await clearAllApiCaches();')) {
    apiClient = apiClient.replace(`    async _mutate(
        url: string,
        method: "POST" | "PUT" | "DELETE" | "PATCH",
        body: any,
        options: RequestInit = {}
    ) {
        const isOnline = navigator.onLine;`, `    async _mutate(
        url: string,
        method: "POST" | "PUT" | "DELETE" | "PATCH",
        body: any,
        options: RequestInit = {}
    ) {
        const isOnline = navigator.onLine;

        // Invalidate ALL offline GET caches on any mutation so stale data isn't loaded
        await clearAllApiCaches();`);
}

fs.writeFileSync('src/lib/apiClient.ts', apiClient);
