// src/deobfuscation/detectors/agile-net.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class AgileNetDetector extends BaseDetector {
  readonly name = 'Agile.NET';
  readonly patterns = ['AgileDotNetRT', 'CliSecureRT'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'AgileDotNetRT')) {
      evidence.push('AgileDotNetRT found');
      confidence += 0.5;
    }

    if (this.checkTypeExists(assembly, 'CliSecureRT')) {
      evidence.push('CliSecureRT runtime detected');
      confidence += 0.4;
    }

    // Virtualization markers
    if (this.checkTypeExists(assembly, 'VM_')) {
      evidence.push('Virtualization detected');
      confidence += 0.1;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Virtualization', 'String Encryption', 'Control Flow']
    };
  }
}
