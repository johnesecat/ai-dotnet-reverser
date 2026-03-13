// src/deobfuscation/engine.ts

import type { Assembly, ObfuscationInfo, ObfuscatorMatch } from '../types/assembly';
import { ConfuserExDetector } from './detectors/confuserex';
import { DotfuscatorDetector } from './detectors/dotfuscator';
import { SmartAssemblyDetector } from './detectors/smartassembly';
import { DotNetReactorDetector } from './detectors/dotnet-reactor';
import { AgileNetDetector } from './detectors/agile-net';
import { CryptoObfuscatorDetector } from './detectors/crypto-obfuscator';
import { EazfuscatorDetector } from './detectors/eazfuscator';
import { BabelDetector } from './detectors/babel';
import { ILProtectorDetector } from './detectors/ilprotector';
import { PhoenixDetector } from './detectors/phoenix';
import { MaxtoCodeDetector } from './detectors/maxtocode';
import { DNGuardDetector } from './detectors/dnguard';
import { GoliathDetector } from './detectors/goliath';
import { DeepSeaDetector } from './detectors/deepsea';
import { ObfuscarDetector } from './detectors/obfuscar';
import { XenocodeDetector } from './detectors/xenocode';
import { UnknownDetector } from './detectors/unknown';

const ALL_DETECTORS = [
  new ConfuserExDetector(),
  new DotfuscatorDetector(),
  new SmartAssemblyDetector(),
  new DotNetReactorDetector(),
  new AgileNetDetector(),
  new CryptoObfuscatorDetector(),
  new EazfuscatorDetector(),
  new BabelDetector(),
  new ILProtectorDetector(),
  new PhoenixDetector(),
  new MaxtoCodeDetector(),
  new DNGuardDetector(),
  new GoliathDetector(),
  new DeepSeaDetector(),
  new ObfuscarDetector(),
  new XenocodeDetector(),
  new UnknownDetector()
];

export class DeobfuscationEngine {
  detectObfuscators(assembly: Assembly): ObfuscationInfo {
    const detectedObfuscators: ObfuscatorMatch[] = [];

    for (const detector of ALL_DETECTORS) {
      const result = detector.detect(assembly);
      
      if (result.isMatch) {
        detectedObfuscators.push({
          name: detector.name,
          version: result.version,
          confidence: result.confidence,
          evidence: result.evidence,
          features: result.features
        });
      }
    }

    // Sort by confidence
    detectedObfuscators.sort((a, b) => b.confidence - a.confidence);

    // Calculate overall confidence
    const maxConfidence = detectedObfuscators[0]?.confidence || 0;

    return {
      detectedObfuscators,
      confidence: maxConfidence,
      patterns: [],
      statistics: {
        totalTypes: assembly.types.length,
        obfuscatedTypes: assembly.types.filter(t => t.isObfuscated).length,
        totalMethods: assembly.methods.length,
        obfuscatedMethods: assembly.methods.filter(m => m.isObfuscated).length,
        averageComplexity: assembly.methods.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / assembly.methods.length,
        nameEntropy: this.calculateNameEntropy(assembly)
      }
    };
  }

  private calculateNameEntropy(assembly: Assembly): number {
    const names = assembly.types.map(t => t.name).join('');
    if (!names) return 0;

    const freq: { [key: string]: number } = {};
    for (const char of names) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / names.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  async applyTransforms(assembly: Assembly): Promise<TransformResults> {
    const results: TransformResults = {
      stringDecrypt: { success: false, itemsProcessed: 0, itemsModified: 0, errors: [] },
      controlFlow: { success: false, itemsProcessed: 0, itemsModified: 0, errors: [] },
      proxyCalls: { success: false, itemsProcessed: 0, itemsModified: 0, errors: [] },
      renaming: { success: false, itemsProcessed: 0, itemsModified: 0, errors: [] }
    };

    // Apply string decryption
    const stringTransform = new StringDecryptTransform();
    results.stringDecrypt = await stringTransform.apply(assembly);

    // Apply control flow simplification
    const cfTransform = new ControlFlowTransform();
    results.controlFlow = await cfTransform.apply(assembly);

    // Apply proxy call removal
    const proxyTransform = new ProxyCallTransform();
    results.proxyCalls = await proxyTransform.apply(assembly);

    // Apply renaming
    const renameTransform = new RenamingTransform();
    results.renaming = await renameTransform.apply(assembly);

    return results;
  }
}

interface TransformResults {
  stringDecrypt: any;
  controlFlow: any;
  proxyCalls: any;
  renaming: any;
}