// src/deobfuscation/detectors/dotfuscator.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class DotfuscatorDetector extends BaseDetector {
  readonly name = 'Dotfuscator';
  readonly patterns = ['DotfuscatorAttribute', 'PreEmptive'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkAttribute(assembly, 'DotfuscatorAttribute')) {
      evidence.push('DotfuscatorAttribute found');
      confidence += 0.5;
    }

    if (this.checkTypeExists(assembly, 'PreEmptive')) {
      evidence.push('PreEmptive Solutions namespace detected');
      confidence += 0.3;
    }

    // Dotfuscator uses sequential naming: a, b, c, aa, ab, etc.
    const sequentialNames = assembly.types.filter(t =>
      /^[a-z]{1,3}$/.test(t.name) && t.isObfuscated
    );

    if (sequentialNames.length > assembly.types.length * 0.4) {
      evidence.push('Sequential naming pattern detected');
      confidence += 0.2;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Renaming', 'String Encryption', 'Enhanced Methods']
    };
  }
}
