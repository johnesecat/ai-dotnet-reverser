// src/deobfuscation/detectors/dotnet-reactor.ts

import { BaseDetector, DetectionResult } from './base-detector';
import type { Assembly } from '../../types/assembly';

export class DotNetReactorDetector extends BaseDetector {
  readonly name = '.NET Reactor';
  readonly patterns = ['<PrivateImplementationDetails>', 'Reactor'];

  detect(assembly: Assembly): DetectionResult {
    const evidence: string[] = [];
    let confidence = 0;

    if (this.checkTypeExists(assembly, 'PrivateImplementationDetails')) {
      evidence.push('PrivateImplementationDetails type found');
      confidence += 0.3;
    }

    // .NET Reactor native code markers
    const nativeMethods = assembly.methods.filter(m =>
      m.name.includes('Native') || m.name.includes('Unmanaged')
    );

    if (nativeMethods.length > 10) {
      evidence.push('Native method stubs detected');
      confidence += 0.3;
    }

    // Check for NecroBit watermark
    if (this.checkTypeExists(assembly, 'NecroBit')) {
      evidence.push('NecroBit watermark found');
      confidence += 0.4;
    }

    return {
      isMatch: confidence >= 0.5,
      confidence,
      evidence,
      features: ['NecroBit', 'Control Flow', 'Anti-Tampering']
    };
  }
}
