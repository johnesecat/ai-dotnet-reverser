// src/utils/crypto.ts

export function calculateSHA256(data: Uint8Array): Promise<string> {
  return crypto.subtle.digest('SHA-256', data).then(hash => {
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
}

export function calculateEntropy(str: string): number {
  if (str.length === 0) return 0;

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

export function isLikelyObfuscated(name: string): boolean {
  // Very short names
  if (name.length <= 2) return true;

  // High entropy (random characters)
  const entropy = calculateEntropy(name);
  if (entropy > 4.5) return true;

  // All single characters
  if (/^[a-zA-Z]$/.test(name)) return true;

  // Contains only digits and underscores
  if (/^[0-9_]+$/.test(name)) return true;

  // Chinese/unicode characters (common in some obfuscators)
  if (/[\u4e00-\u9fa5]/.test(name)) return true;

  // Zero-width or control characters
  if (/[\u200b-\u200f\u202a-\u202e\ufeff]/.test(name)) return true;

  return false;
}
