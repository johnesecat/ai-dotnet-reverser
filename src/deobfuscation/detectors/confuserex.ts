// src/deobfuscation/detectors/confuserex.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class ConfuserExDetector extends BaseDetector {
  readonly name = 'ConfuserEx';
  readonly patterns = ['ConfusedBy', 'Confuser', '<Module>.cctor'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    // Check for ConfusedBy attribute
    if (this.checkTypeExists(assembly, 'ConfusedBy')) {
      evidence.push('ConfusedByAttribute found');
      confidence += 0.4;
    }

    // Check for typical ConfuserEx type names
    const confuserTypes = assembly.types.filter(t => 
      /^[a-zA-Z]{1,2}$/.test(t.name) || // Single/double letter types
      t.name.includes('<') || // Generic/nested obfuscation
      /^Class[0-9]+$/.test(t.name)
    );

    if (confuserTypes.length > assembly.types.length * 0.3) {
      evidence.push(`${confuserTypes.length} types with ConfuserEx naming pattern`);
      confidence += 0.3;
    }

    // Check for string encryption pattern
    const stringDecryptMethods = assembly.methods.filter(m =>
      m.hasEncryptedStrings || m.name.includes('Decrypt') || m.name.length <= 2
    );

    if (stringDecryptMethods.length > 0) {
      evidence.push('String decryption methods detected');
      confidence += 0.2;
    }

    // Check for control flow obfuscation
    const highComplexity = assembly.methods.filter(m => m.cyclomaticComplexity > 15);
    if (highComplexity.length > assembly.methods.length * 0.2) {
      evidence.push('Control flow obfuscation detected');
      confidence += 0.1;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['String Encryption', 'Control Flow', 'Renaming']
    };
  }
}
