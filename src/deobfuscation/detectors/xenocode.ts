// src/deobfuscation/detectors/xenocode.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class XenocodeDetector extends BaseDetector {
  readonly name = 'Xenocode (Spices.Net)';
  readonly patterns = ['Xenocode', 'Spices', '9Rays'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, '9Rays') || this.checkTypeExists(assembly, 'Spices')) {
      evidence.push('Xenocode/Spices.Net watermark found');
      confidence += 0.5;
    }

    // Xenocode string encryption pattern
    const stringDecrypt = assembly.methods.filter(m =>
      m.name.includes('String') && m.name.includes('Get')
    );

    if (stringDecrypt.length > 0) {
      evidence.push('String decryption methods detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['String Encryption', 'Renaming', 'Control Flow']
    };
  }
}
