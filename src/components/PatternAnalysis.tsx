// src/components/PatternAnalysis.tsx

import React from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { ObfuscationInfo } from '../types/assembly';

interface PatternAnalysisProps {
  obfuscationInfo: ObfuscationInfo;
}

export function PatternAnalysis({ obfuscationInfo }: PatternAnalysisProps) {
  if (!obfuscationInfo.patterns || obfuscationInfo.patterns.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Pattern Analysis
        </h3>
      </div>

      <div className="space-y-3">
        {obfuscationInfo.patterns.map((pattern, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {pattern.confidence >= 0.8 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : pattern.confidence >= 0.5 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {this.getPatternTypeName(pattern.type)}
                </span>
              </div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {(pattern.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {pattern.description}
            </p>

            {pattern.locations && pattern.locations.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Found in:
                </div>
                <div className="flex flex-wrap gap-1">
                  {pattern.locations.slice(0, 5).map((loc, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded font-mono"
                    >
                      {loc}
                    </span>
                  ))}
                  {pattern.locations.length > 5 && (
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      +{pattern.locations.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
          Pattern Summary
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          {obfuscationInfo.patterns.length} obfuscation pattern{obfuscationInfo.patterns.length !== 1 ? 's' : ''} detected
        </div>
      </div>
    </div>
  );

  private getPatternTypeName(type: string): string {
    const names: { [key: string]: string } = {
      'string_encryption': 'String Encryption',
      'control_flow': 'Control Flow Obfuscation',
      'proxy_calls': 'Proxy Call Indirection',
      'renaming': 'Identifier Renaming',
      'anti_tamper': 'Anti-Tamper Protection'
    };

    return names[type] || type;
  }
}
