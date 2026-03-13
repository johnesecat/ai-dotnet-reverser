// src/deobfuscation/detectors/crypto-obfuscator.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class CryptoObfuscatorDetector extends BaseDetector {
  readonly name = 'Crypto Obfuscator';
  readonly patterns = ['CryptoObfuscator', 'SecureTeam'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'SecureTeam')) {
      evidence.push('SecureTeam namespace found');
      confidence += 0.4;
    }

    // Symbol renaming to invalid identifiers
    const invalidNames = assembly.types.filter(t =>
      /^[\s\t\r\n]+$/.test(t.name) || // Whitespace-only names
      t.name.includes('\0')
    );

    if (invalidNames.length > 0) {
      evidence.push('Invalid identifier obfuscation detected');
      confidence += 0.3;
    }

    // String encryption
    if (assembly.methods.some(m => m.name.includes('Decrypt') && m.hasEncryptedStrings)) {
      evidence.push('Advanced string encryption detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Symbol Renaming', 'String Encryption', 'ILDASM Protection']
    };
  }
}
