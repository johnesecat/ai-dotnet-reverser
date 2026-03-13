// src/deobfuscation/detectors/babel.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class BabelDetector extends BaseDetector {
  readonly name = 'Babel Obfuscator';
  readonly patterns = ['BabelObfuscator', 'BabelAttribute'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkAttribute(assembly, 'BabelAttribute')) {
      evidence.push('BabelAttribute found');
      confidence += 0.5;
    }

    // Babel uses specific control flow patterns
    const switchMethods = assembly.methods.filter(m =>
      m.cyclomaticComplexity > 10 && m.instructions &&
      m.instructions.filter(i => i.opcode === 'switch').length > 2
    );

    if (switchMethods.length > 0) {
      evidence.push('Switch-based control flow detected');
      confidence += 0.3;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['Control Flow', 'String Encryption']
    };
  }
}
