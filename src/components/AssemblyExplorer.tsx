// src/components/AssemblyExplorer.tsx

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Package, Code } from 'lucide-react';
import { useAssemblyStore } from '../store/assembly-store';
import type { Type } from '../types/assembly';

export function AssemblyExplorer() {
  const { assembly, selectedMethod, setSelectedMethod, setSelectedType } = useAssemblyStore();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  if (!assembly) return null;

  const toggleType = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const groupedTypes = assembly.types.reduce((acc, type) => {
    const ns = type.namespace || '(global)';
    if (!acc[ns]) acc[ns] = [];
    acc[ns].push(type);
    return acc;
  }, {} as Record<string, Type[]>);

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assembly Explorer</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {assembly.name} v{assembly.version}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {assembly.types.length} types, {assembly.methods.length} methods
        </p>
      </div>

      <div className="p-2">
        {Object.entries(groupedTypes).map(([namespace, types]) => (
          <div key={namespace} className="mb-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-blue-700 dark:text-blue-400">
              <Package className="w-4 h-4" />
              <span>{namespace}</span>
            </div>

            {types.map(type => (
              <div key={type.id} className="ml-4">
                <button
                  onClick={() => {
                    toggleType(type.id);
                    setSelectedType(type);
                  }}
                  className="flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm"
                >
                  {expandedTypes.has(type.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FileCode className={`w-4 h-4 ${type.isObfuscated ? 'text-red-500' : 'text-green-600'}`} />
                  <span className={type.isObfuscated ? 'text-red-600 dark:text-red-400 font-mono text-xs' : 'text-gray-900 dark:text-gray-100'}>
                    {type.name}
                  </span>
                </button>

                {expandedTypes.has(type.id) && (
                  <div className="ml-8 mt-1">
                    {type.methods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method)}
                        className={`
                          flex items-center gap-2 px-2 py-1 w-full text-left rounded text-xs
                          ${selectedMethod?.id === method.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                        `}
                      >
                        <Code className={`w-3 h-3 ${method.isObfuscated ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className={method.isObfuscated ? 'text-orange-600 dark:text-orange-400 font-mono' : 'text-gray-700 dark:text-gray-300'}>
                          {method.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
