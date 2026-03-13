// src/deobfuscation/transforms/string-decrypt.ts

import type { Assembly, Method } from '../../types/assembly';

/**
 * String decryption transform
 * Identifies and decrypts obfuscated strings
 */

export class StringDecryptTransform {
  async apply(assembly: Assembly): Promise<TransformResult> {
    const result: TransformResult = {
      success: true,
      itemsProcessed: 0,
      itemsModified: 0,
      errors: []
    };

    try {
      // Find string decryption methods
      const decryptMethods = this.findDecryptionMethods(assembly);
      
      if (decryptMethods.length === 0) {
        result.success = true;
        result.itemsProcessed = 0;
        return result;
      }

      // Find encrypted strings
      const encryptedStrings = this.findEncryptedStrings(assembly);
      result.itemsProcessed = encryptedStrings.length;

      // Attempt decryption
      for (const str of encryptedStrings) {
        const decrypted = this.tryDecrypt(str, decryptMethods);
        if (decrypted) {
          str.decrypted = decrypted;
          result.itemsModified++;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private findDecryptionMethods(assembly: Assembly): Method[] {
    return assembly.methods.filter(method => {
      // Look for typical decryption method patterns
      const name = method.name.toLowerCase();
      
      // Common names
      if (name.includes('decrypt') || 
          name.includes('decode') || 
          name.includes('get') && name.length < 5) {
        return true;
      }

      // Methods that return string and take int/string parameters
      if (method.signature.includes('String') && 
          (method.signature.includes('Int32') || method.signature.includes('String'))) {
        return true;
      }

      return false;
    });
  }

  private findEncryptedStrings(assembly: Assembly): EncryptedString[] {
    const encrypted: EncryptedString[] = [];

    for (const method of assembly.methods) {
      if (!method.ilCode) continue;

      // Look for ldstr instructions with suspicious strings
      const matches = method.ilCode.matchAll(/ldstr\s+"([^"]+)"/g);
      
      for (const match of matches) {
        const str = match[1];
        
        // Check if string looks encrypted
        if (this.looksEncrypted(str)) {
          encrypted.push({
            original: str,
            method: method.id,
            offset: 0,
            decrypted: null
          });
        }
      }
    }

    return encrypted;
  }

  private looksEncrypted(str: string): boolean {
    // Base64 pattern
    if (/^[A-Za-z0-9+/]+=*$/.test(str) && str.length > 10) return true;

    // Hex pattern
    if (/^[0-9A-Fa-f]+$/.test(str) && str.length % 2 === 0 && str.length > 10) return true;

    // High entropy
    const entropy = this.calculateEntropy(str);
    if (entropy > 4.5) return true;

    // Contains many special characters
    const specialCount = (str.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialCount / str.length > 0.3) return true;

    return false;
  }

  private tryDecrypt(str: EncryptedString, decryptMethods: Method[]): string | null {
    // Try different decryption methods

    // 1. Base64
    try {
      const decoded = atob(str.original);
      if (this.isPrintable(decoded)) {
        return decoded;
      }
    } catch {}

    // 2. XOR with common keys
    for (const key of [42, 13, 7, 255, 128]) {
      try {
        const decrypted = this.xorDecrypt(str.original, key);
        if (this.isPrintable(decrypted)) {
          return decrypted;
        }
      } catch {}
    }

    // 3. Caesar cipher
    for (let shift = 1; shift < 26; shift++) {
      const decrypted = this.caesarDecrypt(str.original, shift);
      if (this.looksLikeText(decrypted)) {
        return decrypted;
      }
    }

    return null;
  }

  private xorDecrypt(hex: string, key: number): string {
    if (!/^[0-9A-Fa-f]+$/.test(hex)) return '';

    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      bytes.push(byte ^ key);
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  private caesarDecrypt(str: string, shift: number): string {
    return str.replace(/[a-zA-Z]/g, char => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const base = isUpper ? 65 : 97;
      return String.fromCharCode(((code - base - shift + 26) % 26) + base);
    });
  }

  private isPrintable(str: string): boolean {
    return /^[\x20-\x7E\s]*$/.test(str);
  }

  private looksLikeText(str: string): boolean {
    // Check if string contains common English words
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her'];
    const lowerStr = str.toLowerCase();
    
    return commonWords.some(word => lowerStr.includes(word));
  }

  private calculateEntropy(str: string): number {
    if (!str) return 0;

    const freq: { [key: string]: number } = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}

interface EncryptedString {
  original: string;
  method: string;
  offset: number;
  decrypted: string | null;
}

export interface TransformResult {
  success: boolean;
  itemsProcessed: number;
  itemsModified: number;
  errors: string[];
}
