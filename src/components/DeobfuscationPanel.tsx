// src/components/DeobfuscationPanel.tsx - COMPLETE FILE

import React, { useState } from 'react';
import { Shield, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAssemblyStore } from '../store/assembly-store';
import { DeobfuscationEngine } from '../deobfuscation/engine';
import { PatternAnalysis } from './PatternAnalysis'; // ← ADD THIS IMPORT

export function DeobfuscationPanel() {
  const { assembly, obfuscationInfo, setObfuscationInfo, isAnalyzing, setIsAnalyzing } = useAssemblyStore();
  const [showDetails, setShowDetails] = useState(false);

  const runAnalysis = () => {
    if (!assembly) return;

    setIsAnalyzing(true);
    
    // Run analysis (simulated async)
    setTimeout(() => {
      const engine = new DeobfuscationEngine();
      const info = engine.detectObfuscators(assembly);
      setObfuscationInfo(info);
      setIsAnalyzing(false);
    }, 500);
  };

  if (!assembly) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Deobfuscation</h2>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {isAnalyzing && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {obfuscationInfo && !isAnalyzing && (
        <div className="space-y-6">
          {/* Detected Obfuscators */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Detected Obfuscators</h3>
            
            {obfuscationInfo.detectedObfuscators.length === 0 ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-200">Clean Assembly</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">No known obfuscation detected</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {obfuscationInfo.detectedObfuscators.map((obf, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{obf.name}</h4>
                        {obf.version && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Version: {obf.version}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {(obf.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">confidence</div>
                      </div>
                    </div>

                    {obf.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {obf.features.map((feature, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {obf.evidence.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {showDetails ? 'Hide' : 'Show'} evidence ({obf.evidence.length})
                        </button>

                        {showDetails && (
                          <ul className="mt-2 space-y-1">
                            {obf.evidence.map((ev, i) => (
                              <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ← ADD PATTERN ANALYSIS HERE ← */}
          {obfuscationInfo && <PatternAnalysis obfuscationInfo={obfuscationInfo} />}
          {/* ← PATTERN ANALYSIS ENDS HERE ← */}

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {obfuscationInfo.statistics.obfuscatedTypes}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Obfuscated Types</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((obfuscationInfo.statistics.obfuscatedTypes / obfuscationInfo.statistics.totalTypes) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {obfuscationInfo.statistics.obfuscatedMethods}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Obfuscated Methods</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((obfuscationInfo.statistics.obfuscatedMethods / obfuscationInfo.statistics.totalMethods) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {obfuscationInfo.statistics.averageComplexity.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Complexity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {obfuscationInfo.statistics.averageComplexity > 10 ? 'High' : 'Normal'}
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {obfuscationInfo.statistics.nameEntropy.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Name Entropy</div>
                <div className="text-xs text-gray-500 mt-1">
                  {obfuscationInfo.statistics.nameEntropy > 4.0 ? 'High randomness' : 'Low randomness'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
