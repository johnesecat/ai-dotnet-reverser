// src/deobfuscation/detectors/dnguard.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class DNGuardDetector extends BaseDetector {
  readonly name = 'DNGuard';
  readonly patterns = ['DNGuard', 'HVM'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'DNGuard')) {
      evidence.push('DNGuard watermark found');
      confidence += 0.5;
    }

    // DNGuard HVM (Hardware Virtual Machine)
    if (this.checkTypeExists(assembly, 'HVM')) {
      evidence.push('HVM virtualization detected');
      confidence += 0.4;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['HVM Virtualization', 'Anti-Debug', 'Anti-Dump']
    };
  }
}
