// src/deobfuscation/detectors/maxtocode.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class MaxtoCodeDetector extends BaseDetector {
  readonly name = 'MaxtoCode';
  readonly patterns = ['MaxtoCode', 'Freeware'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'MaxtoCode')) {
      evidence.push('MaxtoCode signature found');
      confidence += 0.6;
    }

    // MaxtoCode typically leaves "Freeware" marker
    if (this.checkTypeExists(assembly, 'Freeware')) {
      evidence.push('Freeware marker detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Encryption', 'Anti-Debug']
    };
  }
}
