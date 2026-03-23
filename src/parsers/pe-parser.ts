import { BinaryReader } from '../utils/binary-reader';

export interface PEInfo {
  isPE: boolean;
  isDotNet: boolean;
  architecture: string;
  clrHeaderRVA: number;
}

export class PEParser {
  static parse(data: Uint8Array): PEInfo {
    try {
      const reader = new BinaryReader(data);

      // DOS Header
      const dosSignature = String.fromCharCode(reader.readUInt8(), reader.readUInt8());
      if (dosSignature !== 'MZ') {
        throw new Error('Invalid DOS signature');
      }

      // Get PE offset
      reader.seek(0x3C);
      const peOffset = reader.readUInt32();

      if (peOffset > data.length - 4) {
        throw new Error('Invalid PE offset');
      }

      // PE Signature
      reader.seek(peOffset);
      const peSig = reader.readUInt32();
      if (peSig !== 0x00004550) { // 'PE\0\0'
        throw new Error('Invalid PE signature');
      }

      // COFF Header
      const machine = reader.readUInt16();
      const architecture = machine === 0x014c ? 'x86' : 
                          machine === 0x8664 ? 'x64' : 
                          machine === 0x0200 ? 'IA64' : 'Unknown';

      // Skip to Optional Header
      reader.seek(peOffset + 24); // After COFF header
      const optionalHeaderSize = reader.readUInt16();
      
      if (optionalHeaderSize === 0) {
        throw new Error('No optional header');
      }

      // Read Optional Header Magic
      reader.seek(peOffset + 24);
      const magic = reader.readUInt16();
      const is64Bit = magic === 0x020b;

      // CLR Header is at different offsets for 32/64 bit
      const clrHeaderOffset = is64Bit ? peOffset + 24 + 128 + 88 : peOffset + 24 + 128 + 72;
      
      reader.seek(clrHeaderOffset);
      const clrHeaderRVA = reader.readUInt32();

      return {
        isPE: true,
        isDotNet: clrHeaderRVA !== 0,
        architecture,
        clrHeaderRVA
      };
    } catch (error) {
      console.error('PE parsing error:', error);
      return {
        isPE: false,
        isDotNet: false,
        architecture: 'Unknown',
        clrHeaderRVA: 0
      };
    }
  }
}
