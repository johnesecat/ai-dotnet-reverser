// src/deobfuscation/detectors/obfuscar.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class ObfuscarDetector extends BaseDetector {
  readonly name = 'Obfuscar';
  readonly patterns = ['Obfuscar', 'ObfuscatedByAttribute'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkAttribute(assembly, 'ObfuscatedByAttribute')) {
      evidence.push('ObfuscatedByAttribute found');
      confidence += 0.5;
    }

    // Obfuscar uses simple sequential naming
    const simpleNames = assembly.types.filter(t =>
      /^[A-Z]$/.test(t.name) // Single capital letters
    );

    if (simpleNames.length > assembly.types.length * 0.3) {
      evidence.push('Obfuscar naming pattern detected');
      confidence += 0.4;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Renaming']
    };
  }
}
