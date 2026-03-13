// src/components/Settings.tsx

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  const [showPanel, setShowPanel] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
        title="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {showPanel && (
        <SettingsModal onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = React.useState({
    enableAI: false,
    apiKey: '',
    maxFileSize: 500,
    autoDeobfuscate: false,
    showComplexity: true,
    darkMode: true
  });

  React.useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Application Settings
        </h2>

        <div className="space-y-4">
          {/* AI Settings */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enableAI}
                onChange={(e) => setSettings({ ...settings, enableAI: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Enable AI Features</span>
            </label>
          </div>

          {settings.enableAI && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                placeholder="sk-ant-..."
              />
            </div>
          )}

          {/* File Size Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              min="1"
              max="1000"
            />
          </div>

          {/* Auto Deobfuscate */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoDeobfuscate}
                onChange={(e) => setSettings({ ...settings, autoDeobfuscate: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Auto-run deobfuscation</span>
            </label>
          </div>

          {/* Show Complexity */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showComplexity}
                onChange={(e) => setSettings({ ...settings, showComplexity: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">Show complexity metrics</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
