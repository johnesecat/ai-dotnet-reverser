import { PEParser } from './pe-parser';
import { CLRParser } from './clr-parser';
import type { AssemblyInfo, ParseResult } from '../types/assembly';

export class AssemblyBuilder {
  static async parse(file: File): Promise<ParseResult> {
    try {
      // Read file
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Validate minimum size
      if (data.length < 64) {
        return { success: false, error: 'File too small to be a valid PE file' };
      }

      // Parse PE structure
      const peInfo = PEParser.parse(data);
      
      if (!peInfo.isPE) {
        return { success: false, error: 'Not a valid PE file' };
      }

      if (!peInfo.isDotNet) {
        return { success: false, error: 'File is not a .NET assembly (no CLR header found)' };
      }

      // Parse CLR metadata
      const metadata = CLRParser.parseMetadata(data);
      const entropy = CLRParser.calculateEntropy(data);

      // Count suspicious names (heuristic)
      const text = new TextDecoder('utf-8', { fatal: false })
        .decode(data.slice(0, Math.min(50000, data.length)));
      
      const singleLetterCount = (text.match(/\x00[a-zA-Z]\x00/g) || []).length;
      const shortNameCount = (text.match(/\x00[a-zA-Z]{1,2}\x00/g) || []).length;
      const suspiciousNames = singleLetterCount + shortNameCount;

      const assembly: AssemblyInfo = {
        name: file.name,
        version: '1.0.0.0',
        fileSize: file.size,
        isPE: peInfo.isPE,
        isDotNet: peInfo.isDotNet,
        architecture: peInfo.architecture,
        detections: [],
        statistics: {
          totalTypes: metadata.typeCount,
          suspiciousNames: Math.min(suspiciousNames, 999),
          averageNameLength: 8,
          entropy: Number(entropy.toFixed(2))
        },
        rawData: data
      };

      return { success: true, assembly };
    } catch (error) {
      console.error('Assembly parse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }
}
