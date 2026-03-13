// src/deobfuscation/detectors/ilprotector.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class ILProtectorDetector extends BaseDetector {
  readonly name = 'ILProtector';
  readonly patterns = ['ILProtector', 'PEiD'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'ILProtector')) {
      evidence.push('ILProtector signature found');
      confidence += 0.5;
    }

    // Native code protection
    const nativeStubs = assembly.methods.filter(m =>
      m.name.includes('InternalCall') || m.name.includes('NativeCode')
    );

    if (nativeStubs.length > 5) {
      evidence.push('Native code stubs detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Native Protection', 'Anti-Debug', 'Anti-Dump']
    };
  }
}
