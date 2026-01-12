"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  shopName: string;
  address?: string;
  gstEnabled: boolean;
  gstNumber?: string | null;
  defaultGstPercent: number;
};

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    alert("Settings saved successfully");
  };

  if (loading) {
    return <div className="p-6 dark:bg-gray-900 dark:text-white">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6 text-red-500 dark:bg-gray-900 dark:text-red-400">Failed to load settings</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold dark:text-white">Settings</h1>

      {/* Shop Details */}
      <div className="border rounded-lg p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="font-semibold dark:text-white">Shop Details</h2>

        <div>
          <label className="block text-sm mb-1 dark:text-white">Shop Name</label>
          <input
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={settings.shopName}
            onChange={(e) =>
              setSettings({ ...settings, shopName: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm mb-1 dark:text-white">Address</label>
          <input
            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={settings.address || ""}
            onChange={(e) =>
              setSettings({ ...settings, address: e.target.value })
            }
          />
        </div>
      </div>

      {/* GST Settings */}
      <div className="border rounded-lg p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="font-semibold dark:text-white">GST Settings</h2>

        <div className="flex items-center justify-between dark:text-white">
          <span>Enable GST</span>
          <input
            type="checkbox"
            checked={settings.gstEnabled}
            onChange={(e) =>
              setSettings({ ...settings, gstEnabled: e.target.checked })
            }
            className="h-5 w-5"
          />
        </div>

        {settings.gstEnabled && (
          <>
            <div>
              <label className="block text-sm mb-1 dark:text-white">GST Number</label>
              <input
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={settings.gstNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings, gstNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-1 dark:text-white">Default GST %</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={settings.defaultGstPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultGstPercent: Number(e.target.value),
                  })
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}