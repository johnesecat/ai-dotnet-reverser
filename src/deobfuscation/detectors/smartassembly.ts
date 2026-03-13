// src/deobfuscation/detectors/smartassembly.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class SmartAssemblyDetector extends BaseDetector {
  readonly name = 'SmartAssembly';
  readonly patterns = ['SmartAssembly.Attributes', 'PoweredByAttribute'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkAttribute(assembly, 'PoweredByAttribute')) {
      evidence.push('PoweredByAttribute found');
      confidence += 0.4;
    }

    if (this.checkTypeExists(assembly, 'SmartAssembly')) {
      evidence.push('SmartAssembly namespace detected');
      confidence += 0.3;
    }

    // SmartAssembly error reporting
    if (this.checkTypeExists(assembly, 'UnhandledExceptionReporting')) {
      evidence.push('Error reporting module found');
      confidence += 0.2;
    }

    // Unicode name obfuscation
    const unicodeNames = assembly.types.filter(t =>
      /[\u200b-\u200f\u202a-\u202e]/.test(t.name)
    );

    if (unicodeNames.length > 0) {
      evidence.push('Unicode character obfuscation detected');
      confidence += 0.1;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['String Encoding', 'Resource Embedding', 'Renaming']
    };
  }
}
