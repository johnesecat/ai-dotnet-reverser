// src/App.tsx

import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { AssemblyExplorer } from './components/AssemblyExplorer';
import { CodeViewer } from './components/CodeViewer';
import { DeobfuscationPanel } from './components/DeobfuscationPanel';
import { useAssemblyStore } from './store/assembly-store';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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
              🔬 AI .NET Deobfuscator
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Supporting 17 obfuscators: ConfuserEx, Dotfuscator, SmartAssembly, .NET Reactor, Agile.NET, and more
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!assembly ? (
          <div className="flex-1 flex items-center justify-center">
            <FileUploader />
          </div>
        ) : (
          <>
            {/* Left Sidebar - Assembly Explorer */}
            <div className="w-80 flex-shrink-0">
              <AssemblyExplorer />
            </div>

            {/* Center - Code Viewer */}
            <div className="flex-1 overflow-hidden">
              <CodeViewer />
            </div>

            {/* Right Sidebar - Deobfuscation Panel */}
            <div className="w-96 flex-shrink-0">
              <DeobfuscationPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
