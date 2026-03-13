// src/deobfuscation/detectors/eazfuscator.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class EazfuscatorDetector extends BaseDetector {
  readonly name = 'Eazfuscator.NET';
  readonly patterns = ['Eazfuscator', 'eaz_'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    // Eazfuscator watermark
    const eazTypes = assembly.types.filter(t =>
      t.name.startsWith('eaz_') || t.name.includes('Eazfuscator')
    );

    if (eazTypes.length > 0) {
      evidence.push('Eazfuscator watermark found');
      confidence += 0.5;
    }

    // Virtualized methods
    const virtualizedMethods = assembly.methods.filter(m =>
      m.cyclomaticComplexity > 20 && m.instructions && m.instructions.length > 100
    );

    if (virtualizedMethods.length > 0) {
      evidence.push('Virtualized methods detected');
      confidence += 0.3;
    }

    // Encrypted resources
    if (this.checkTypeExists(assembly, 'ResourceDecryptor')) {
      evidence.push('Resource encryption detected');
      confidence += 0.2;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Virtualization', 'String Encryption', 'Symbol Renaming']
    };
  }
}
