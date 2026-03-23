export interface AssemblyInfo {
  name: string;
  version: string;
  fileSize: number;
  isPE: boolean;
  isDotNet: boolean;
  architecture: string;
  detections: Detection[];
  statistics: Statistics;
  rawData?: Uint8Array;
}

export interface Detection {
  name: string;
  confidence: number;
  evidence: string[];
  category: 'obfuscator' | 'packer' | 'protector';
  severity: 'high' | 'medium' | 'low';
}

export interface Statistics {
  totalTypes: number;
  suspiciousNames: number;
  averageNameLength: number;
  entropy: number;
}

export interface ParseResult {
  success: boolean;
  assembly?: AssemblyInfo;
  error?: string;
}
