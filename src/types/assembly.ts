// src/types/assembly.ts

export interface Assembly {
  name: string;
  version: string;
  types: Type[];
  methods: Method[];
  hash: string;
  fileSize: number;
  obfuscationInfo?: ObfuscationInfo;
}

export interface Type {
  id: string;
  name: string;
  fullName: string;
  namespace: string;
  methods: Method[];
  fields: Field[];
  isObfuscated: boolean;
}

export interface Method {
  id: string;
  name: string;
  signature: string;
  ilCode?: string;
  instructions?: ILInstruction[];
  cyclomaticComplexity: number;
  usesReflection: boolean;
  hasProxyCalls: boolean;
  hasEncryptedStrings: boolean;
  isObfuscated: boolean;
}

export interface Field {
  name: string;
  type: string;
}

export interface ILInstruction {
  offset: number;
  opcode: string;
  operand?: any;
}

export interface ObfuscationInfo {
  detectedObfuscators: ObfuscatorMatch[];
  confidence: number;
  patterns: DetectedPattern[];
  statistics: ObfuscationStats;
}

export interface ObfuscatorMatch {
  name: string;
  version?: string;
  confidence: number;
  evidence: string[];
  features: string[];
}

export interface DetectedPattern {
  type: 'string_encryption' | 'control_flow' | 'proxy_calls' | 'renaming' | 'anti_tamper';
  confidence: number;
  description: string;
  locations: string[];
}

export interface ObfuscationStats {
  totalTypes: number;
  obfuscatedTypes: number;
  totalMethods: number;
  obfuscatedMethods: number;
  averageComplexity: number;
  nameEntropy: number;
}

export interface PEInfo {
  isValid: boolean;
  isPE32Plus: boolean;
  clrHeaderRVA: number;
  clrHeaderSize: number;
  metadataRVA: number;
  metadataSize: number;
  sections: PESection[];
  error?: string;
}

export interface PESection {
  name: string;
  virtualAddress: number;
  virtualSize: number;
  rawDataPointer: number;
  rawDataSize: number;
}
