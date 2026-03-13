// src/deobfuscation/detectors/goliath.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class GoliathDetector extends BaseDetector {
  readonly name = 'Goliath .NET Obfuscator';
  readonly patterns = ['Goliath', 'G!'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'Goliath')) {
      evidence.push('Goliath signature found');
      confidence += 0.6;
    }

    // Goliath uses "G!" prefix
    const goliathTypes = assembly.types.filter(t => t.name.startsWith('G!'));
    if (goliathTypes.length > 0) {
      evidence.push('Goliath naming pattern detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Renaming', 'String Encryption']
    };
  }
}
