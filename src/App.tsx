// src/App.tsx (COMPLETE WITH ALL FEATURES)

import React, { useState } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { AssemblyExplorer } from './components/AssemblyExplorer';
import { CodeViewer } from './components/CodeViewer';
import { DeobfuscationPanel } from './components/DeobfuscationPanel';
import { ExportPanel } from './components/ExportPanel';
import { GlobalSearchPanel } from './components/GlobalSearchPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useAssemblyStore } from './store/assembly-store';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showSettings, setShowSettings] = useState(false);
  const { assembly } = useAssemblyStore();

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🔬 Advanced .NET Deobfuscator Pro
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Full metadata • 17 obfuscators • AI-powered • String decryption • CFG analysis • VS export
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      {assembly && <GlobalSearchPanel />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!assembly ? (
          <div className="flex-1 flex items-center justify-center">
            <FileUploader />
          </div>
        ) : (
          <>
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar */}
              <div className="w-80 flex-shrink-0">
                <AssemblyExplorer />
              </div>

              {/* Center */}
              <div className="flex-1 overflow-hidden">
                <CodeViewer />
              </div>

              {/* Right Sidebar */}
              <div className="w-96 flex-shrink-0">
                <DeobfuscationPanel />
              </div>
            </div>

            {/* Bottom Export Panel */}
            <ExportPanel />
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}