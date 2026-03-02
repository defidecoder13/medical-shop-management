"use client";

import { useState, useEffect } from "react";
import { processSyncQueue } from "@/src/lib/localDb";

export function useNetwork() {
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        // Set initial value
        setIsOnline(navigator.onLine);

        const handleOnline = async () => {
            setIsOnline(true);
            console.log("[Network] Connection restored. Processing offline sync queue...");
            await processSyncQueue(
                (item) => console.log(`[Sync Success] Operation ${item.id} synced successfully.`),
                (error, item) => console.error(`[Sync Error] Operation ${item.id} failed:`, error)
            );
        };

        const handleOffline = () => {
            console.warn("[Network] Connection lost. Operating in offline mode.");
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return { isOnline };
}
