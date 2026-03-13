// src/deobfuscation/detectors/unknown.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';
import { calculateEntropy } from '../../utils/crypto';

export class UnknownDetector extends BaseDetector {
  readonly name = 'Unknown Obfuscator';
  readonly patterns = [];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    // Calculate overall obfuscation metrics
    const obfuscatedRatio = this.countObfuscatedNames(assembly) / assembly.types.length;
    const nameEntropy = this.calculateNameEntropy(assembly);
    const avgComplexity = assembly.methods.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / assembly.methods.length;

    if (obfuscatedRatio > 0.5) {
      evidence.push(`${(obfuscatedRatio * 100).toFixed(1)}% of types have obfuscated names`);
      confidence += 0.3;
    }

    if (nameEntropy > 4.0) {
      evidence.push(`High name entropy: ${nameEntropy.toFixed(2)}`);
      confidence += 0.2;
    }

    if (avgComplexity > 10) {
      evidence.push(`High average complexity: ${avgComplexity.toFixed(1)}`);
      confidence += 0.2;
    }

    // String encryption indicators
    const encryptedStrings = assembly.methods.filter(m => m.hasEncryptedStrings).length;
    if (encryptedStrings > 0) {
      evidence.push(`${encryptedStrings} methods with encrypted strings`);
      confidence += 0.2;
    }

    // Proxy calls
    const proxyCalls = assembly.methods.filter(m => m.hasProxyCalls).length;
    if (proxyCalls > 0) {
      evidence.push(`${proxyCalls} proxy call methods detected`);
      confidence += 0.1;
    }

    return {
      isMatch: confidence >= 0.3,
      confidence,
      evidence,
      features: ['Unknown Protection']
    };
  }
}
