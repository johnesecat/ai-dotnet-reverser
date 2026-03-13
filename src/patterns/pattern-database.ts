// src/patterns/pattern-database.ts

/**
 * Database of known obfuscation patterns
 */

export class PatternDatabase {
  private patterns: ObfuscationPattern[] = [];

  constructor() {
    this.loadPatterns();
  }

  private loadPatterns(): void {
    // ConfuserEx patterns
    this.patterns.push({
      id: 'confuserex_switch_cf',
      name: 'ConfuserEx Switch-Based Control Flow',
      category: 'control_flow',
      signature: {
        ilPattern: /switch\s*\(\s*\w+\s*\)/,
        complexity: { min: 10, max: 100 },
        instructionPattern: ['switch', 'br', 'ldc.i4']
      },
      confidence: 0.8,
      description: 'Control flow obfuscation using switch statements with computed case values'
    });

    this.patterns.push({
      id: 'confuserex_string_encrypt',
      name: 'ConfuserEx String Encryption',
      category: 'string_encryption',
      signature: {
        methodName: /^[a-zA-Z]{1,2}$/,
        hasDecryptMethod: true,
        usesXOR: true
      },
      confidence: 0.9,
      description: 'Encrypted strings with XOR-based decryption'
    });

    // Dotfuscator patterns
    this.patterns.push({
      id: 'dotfuscator_rename',
      name: 'Dotfuscator Sequential Renaming',
      category: 'renaming',
      signature: {
        namePattern: /^[a-z]{1,3}$/,
        sequential: true
      },
      confidence: 0.85,
      description: 'Types and methods renamed to sequential single letters (a, b, c, aa, ab, etc.)'
    });

    // SmartAssembly patterns
    this.patterns.push({
      id: 'smartassembly_zerobyte',
      name: 'SmartAssembly Zero-Byte Naming',
      category: 'renaming',
      signature: {
        containsZeroWidth: true,
        namePattern: /[\u200b-\u200f]/
      },
      confidence: 0.95,
      description: 'Uses zero-width and invisible unicode characters in names'
    });

    // Generic patterns
    this.patterns.push({
      id: 'generic_proxy_calls',
      name: 'Proxy Call Indirection',
      category: 'proxy_calls',
      signature: {
        ilPattern: /call.*\bcallvirt\b/,
        indirectionLevel: { min: 2 }
      },
      confidence: 0.7,
      description: 'Method calls go through proxy methods for indirection'
    });

    this.patterns.push({
      id: 'generic_math_obfuscation',
      name: 'Mathematical Obfuscation',
      category: 'arithmetic',
      signature: {
        instructionPattern: ['add', 'sub', 'mul', 'xor', 'and', 'or'],
        density: { min: 0.3 }
      },
      confidence: 0.6,
      description: 'Excessive mathematical operations to obscure constants'
    });
  }

  findMatches(context: ObfuscationContext): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns) {
      const match = this.testPattern(pattern, context);
      if (match) {
        matches.push(match);
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private testPattern(pattern: ObfuscationPattern, context: ObfuscationContext): PatternMatch | null {
    let score = 0;
    let maxScore = 0;
    const evidence: string[] = [];

    // Test IL pattern
    if (pattern.signature.ilPattern && context.ilCode) {
      maxScore += 1;
      if (pattern.signature.ilPattern.test(context.ilCode)) {
        score += 1;
        evidence.push('IL pattern matched');
      }
    }

    // Test name pattern
    if (pattern.signature.namePattern && context.name) {
      maxScore += 1;
      if (pattern.signature.namePattern.test(context.name)) {
        score += 1;
        evidence.push('Name pattern matched');
      }
    }

    // Test complexity
    if (pattern.signature.complexity && context.complexity !== undefined) {
      maxScore += 1;
      if (context.complexity >= (pattern.signature.complexity.min || 0) &&
          context.complexity <= (pattern.signature.complexity.max || 999)) {
        score += 1;
        evidence.push('Complexity in expected range');
      }
    }

    // Test instruction pattern
    if (pattern.signature.instructionPattern && context.instructions) {
      maxScore += 1;
      const hasAll = pattern.signature.instructionPattern.every(opcode =>
        context.instructions!.some(i => i.includes(opcode))
      );
      if (hasAll) {
        score += 1;
        evidence.push('Instruction pattern matched');
      }
    }

    // Calculate confidence
    const confidence = maxScore > 0 ? (score / maxScore) * pattern.confidence : 0;

    if (confidence >= 0.5) {
      return {
        pattern,
        confidence,
        evidence
      };
    }

    return null;
  }

  getPatternsByCategory(category: string): ObfuscationPattern[] {
    return this.patterns.filter(p => p.category === category);
  }

  getPattern(id: string): ObfuscationPattern | undefined {
    return this.patterns.find(p => p.id === id);
  }
}

export interface ObfuscationPattern {
  id: string;
  name: string;
  category: string;
  signature: {
    ilPattern?: RegExp;
    namePattern?: RegExp;
    methodName?: RegExp;
    hasDecryptMethod?: boolean;
    usesXOR?: boolean;
    complexity?: { min?: number; max?: number };
    instructionPattern?: string[];
    sequential?: boolean;
    containsZeroWidth?: boolean;
    indirectionLevel?: { min: number };
    density?: { min: number };
  };
  confidence: number;
  description: string;
}

export interface ObfuscationContext {
  name?: string;
  ilCode?: string;
  complexity?: number;
  instructions?: string[];
  methodCount?: number;
}

export interface PatternMatch {
  pattern: ObfuscationPattern;
  confidence: number;
  evidence: string[];
}