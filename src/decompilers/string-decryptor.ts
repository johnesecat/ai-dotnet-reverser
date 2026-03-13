// src/decompilers/string-decryptor.ts

/**
 * String decryption engine for common obfuscators
 */

export class StringDecryptor {
  private decryptors: Map<string, DecryptorFunction> = new Map();

  constructor() {
    this.registerDecryptors();
  }

  registerDecryptors(): void {
    // ConfuserEx patterns
    this.decryptors.set('confuserex_xor', this.decryptXOR);
    this.decryptors.set('confuserex_base64', this.decryptBase64);
    
    // Dotfuscator patterns
    this.decryptors.set('dotfuscator_caesar', this.decryptCaesar);
    
    // SmartAssembly patterns
    this.decryptors.set('smartassembly_simple', this.decryptSmartAssembly);
    
    // Generic patterns
    this.decryptors.set('base64', this.decryptBase64);
    this.decryptors.set('rot13', this.decryptROT13);
    this.decryptors.set('reverse', this.decryptReverse);
  }

  decrypt(encryptedString: string, pattern: string, key?: string): string | null {
    const decryptor = this.decryptors.get(pattern);
    if (!decryptor) return null;

    try {
      return decryptor(encryptedString, key);
    } catch (error) {
      console.error(`Decryption failed for pattern ${pattern}:`, error);
      return null;
    }
  }

  detectPattern(encryptedString: string): string | null {
    // Try to detect encryption pattern
    
    // Base64 pattern
    if (/^[A-Za-z0-9+/]+=*$/.test(encryptedString)) {
      try {
        atob(encryptedString);
        return 'base64';
      } catch {
        // Not valid base64
      }
    }

    // All uppercase or all lowercase (possible Caesar)
    if (/^[A-Z]+$/.test(encryptedString) || /^[a-z]+$/.test(encryptedString)) {
      return 'rot13';
    }

    // Contains only hex characters
    if (/^[0-9A-Fa-f]+$/.test(encryptedString) && encryptedString.length % 2 === 0) {
      return 'confuserex_xor';
    }

    return null;
  }

  // Decryption functions
  private decryptXOR(encrypted: string, key: string = '42'): string {
    const keyNum = parseInt(key);
    const bytes = this.hexToBytes(encrypted);
    const decrypted = bytes.map(b => b ^ keyNum);
    return new TextDecoder().decode(new Uint8Array(decrypted));
  }

  private decryptBase64(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  }

  private decryptCaesar(encrypted: string, shift: string = '13'): string {
    const shiftNum = parseInt(shift);
    return encrypted.replace(/[a-zA-Z]/g, char => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const base = isUpper ? 65 : 97;
      return String.fromCharCode(((code - base - shiftNum + 26) % 26) + base);
    });
  }

  private decryptROT13(encrypted: string): string {
    return this.decryptCaesar(encrypted, '13');
  }

  private decryptReverse(encrypted: string): string {
    return encrypted.split('').reverse().join('');
  }

  private decryptSmartAssembly(encrypted: string): string {
    // SmartAssembly often uses simple XOR with incrementing key
    let result = '';
    for (let i = 0; i < encrypted.length; i++) {
      result += String.fromCharCode(encrypted.charCodeAt(i) ^ (i & 0xFF));
    }
    return result;
  }

  private hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  // Batch decryption
  decryptAll(strings: EncryptedString[]): DecryptedString[] {
    return strings.map(str => {
      const pattern = str.pattern || this.detectPattern(str.encrypted);
      if (!pattern) {
        return { original: str.encrypted, decrypted: null, pattern: null };
      }

      const decrypted = this.decrypt(str.encrypted, pattern, str.key);
      return {
        original: str.encrypted,
        decrypted,
        pattern
      };
    });
  }
}

type DecryptorFunction = (encrypted: string, key?: string) => string;

export interface EncryptedString {
  encrypted: string;
  pattern?: string;
  key?: string;
}

export interface DecryptedString {
  original: string;
  decrypted: string | null;
  pattern: string | null;
}