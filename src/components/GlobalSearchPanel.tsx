// src/components/GlobalSearchPanel.tsx

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { GlobalSearch } from '../search/global-search';
import { useAssemblyStore } from '../store/assembly-store';

export function GlobalSearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [search] = useState(() => new GlobalSearch());
  const { assembly, setSelectedMethod, setSelectedType } = useAssemblyStore();

  useEffect(() => {
    if (assembly) {
      search.buildIndex(assembly);
    }
  }, [assembly, search]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults(null);
      return;
    }

    const searchResults = search.search(q);
    setResults(searchResults);
  };

  const handleSelectMethod = (methodId: string, typeName: string) => {
    if (!assembly) return;

    const type = assembly.types.find(t => t.fullName === typeName);
    if (type) {
      setSelectedType(type);
      const method = type.methods.find(m => m.id === methodId);
      if (method) {
        setSelectedMethod(method);
      }
    }
    setQuery('');
    setResults(null);
  };

  if (!assembly) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search types, methods, fields..."
          className="flex-1 px-2 py-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
        />
        {query && (
          <button onClick={() => handleSearch('')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {results && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b shadow-lg max-h-96 overflow-y-auto z-50">
          {/* Types */}
          {results.types.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Types</div>
              {results.types.map((type: any) => (
                <button
                  key={type.id}
                  onClick={() => {
                    const t = assembly.types.find(t => t.id === type.id);
                    if (t) setSelectedType(t);
                    setResults(null);
                  }}
                  className="w-full px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                >
                  {type.fullName}
                </button>
              ))}
            </div>
          )}

          {/* Methods */}
          {results.methods.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Methods</div>
              {results.methods.map((method: any) => (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id, method.typeName)}
                  className="w-full px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="text-sm font-mono">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.typeName}</div>
                </button>
              ))}
            </div>
          )}

          {results.types.length === 0 && results.methods.length === 0 && results.fields.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}