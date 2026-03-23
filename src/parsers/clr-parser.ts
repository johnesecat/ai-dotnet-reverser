export interface CLRMetadata {
  typeCount: number;
  methodCount: number;
  hasResources: boolean;
  hasNativeCode: boolean;
  suspiciousStrings: string[];
}

export class CLRParser {
  static parseMetadata(data: Uint8Array): CLRMetadata {
    // Convert to string for pattern matching
    const text = new TextDecoder('utf-8', { fatal: false })
      .decode(data.slice(0, Math.min(100000, data.length)));

    // Estimate type count by looking for type keywords
    const typeMatches = text.match(/(\x00class\x00|\x00interface\x00|\x00struct\x00|\x00enum\x00)/gi);
    const typeCount = typeMatches ? Math.min(typeMatches.length, 1000) : 10;

    // Estimate method count
    const methodMatches = text.match(/(\x00void\x00|\x00int\x00|\x00string\x00|\x00bool\x00)/gi);
    const methodCount = methodMatches ? Math.min(methodMatches.length, 5000) : 50;

    // Check for resources
    const hasResources = text.includes('.resources') || text.includes('.resx');

    // Check for native code indicators
    const hasNativeCode = text.includes('native') || text.includes('unmanaged') || text.includes('DllImport');

    // Look for suspicious strings
    const suspiciousStrings: string[] = [];
    const commonObfuscatorMarkers = [
      'ConfusedBy', 'Obfuscated', 'SmartAssembly', 'Dotfuscator', 
      'Reactor', 'Agile', 'Crypto', 'Eazfuscator', 'Babel'
    ];

    for (const marker of commonObfuscatorMarkers) {
      if (text.includes(marker)) {
        suspiciousStrings.push(marker);
      }
    }

    return {
      typeCount: Math.max(typeCount, 1),
      methodCount: Math.max(methodCount, 1),
      hasResources,
      hasNativeCode,
      suspiciousStrings
    };
  }

  static calculateEntropy(data: Uint8Array): number {
    const sample = data.slice(0, Math.min(10000, data.length));
    const freq = new Map<number, number>();
    
    for (const byte of sample) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / sample.length;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }
}
