// src/deobfuscation/detectors/base-detector.ts

import type { Assembly, ObfuscatorMatch } from '../../types/assembly';

export interface DetectionResult {
  isMatch: boolean;
  confidence: number;
  evidence: string[];
  features: string[];
  version?: string;
}

export abstract class BaseDetector {
  abstract readonly name: string;
  abstract readonly patterns: string[];

  abstract detect(assembly: Assembly): DetectionResult;

  protected checkAttribute(assembly: Assembly, attributeName: string): boolean {
    // Simplified: In real implementation, check assembly attributes
    return false;
  }

  protected checkTypeExists(assembly: Assembly, typeName: string): boolean {
    return assembly.types.some(t => 
      t.name.includes(typeName) || t.fullName.includes(typeName)
    );
  }

  protected calculateNameEntropy(assembly: Assembly): number {
    const names = assembly.types.map(t => t.name).join('');
    if (!names) return 0;

    const freq: { [key: string]: number } = {};
    for (const char of names) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = names.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  protected countObfuscatedNames(assembly: Assembly): number {
    return assembly.types.filter(t => t.isObfuscated).length;
  }
}
