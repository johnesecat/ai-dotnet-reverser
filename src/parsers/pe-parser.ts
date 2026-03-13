// src/parsers/pe-parser.ts

import { BinaryReader } from '../utils/binary-reader';
import type { PEInfo, PESection } from '../types/assembly';

export class PEParser {
  private data: Uint8Array;
  private reader: BinaryReader;

  constructor(data: Uint8Array) {
    this.data = data;
    this.reader = new BinaryReader(data);
  }

  parse(): PEInfo {
    try {
      // DOS header
      const dosSignature = this.reader.readUInt16();
      if (dosSignature !== 0x5A4D) {
        return this.errorResult('Invalid DOS signature');
      }

      this.reader.setPosition(0x3C);
      const peHeaderOffset = this.reader.readUInt32();

      // PE signature
      this.reader.setPosition(peHeaderOffset);
      const peSignature = this.reader.readUInt32();
      if (peSignature !== 0x00004550) {
        return this.errorResult('Invalid PE signature');
      }

      // COFF header
      const machine = this.reader.readUInt16();
      const numberOfSections = this.reader.readUInt16();
      this.reader.skip(12);
      const sizeOfOptionalHeader = this.reader.readUInt16();
      const characteristics = this.reader.readUInt16();

      // Optional header
      const optionalHeaderStart = this.reader.getPosition();
      const magic = this.reader.readUInt16();
      const isPE32Plus = magic === 0x020B;

      if (magic !== 0x010B && magic !== 0x020B) {
        return this.errorResult('Invalid optional header magic');
      }

      // Navigate to data directories
      const dataDirectoriesOffset = isPE32Plus ? 112 : 96;
      this.reader.setPosition(optionalHeaderStart + dataDirectoriesOffset);
      const numberOfDataDirectories = this.reader.readUInt32();

      if (numberOfDataDirectories < 15) {
        return this.errorResult('Not a .NET assembly');
      }

      // Skip to CLR header (directory 14)
      this.reader.skip(14 * 8);
      const clrHeaderRVA = this.reader.readUInt32();
      const clrHeaderSize = this.reader.readUInt32();

      if (clrHeaderRVA === 0) {
        return this.errorResult('Not a .NET assembly');
      }

      // Read section headers
      const sectionHeadersOffset = optionalHeaderStart + sizeOfOptionalHeader;
      this.reader.setPosition(sectionHeadersOffset);

      const sections: PESection[] = [];
      for (let i = 0; i < numberOfSections; i++) {
        const nameBytes = this.reader.readBytes(8);
        const name = new TextDecoder('ascii').decode(nameBytes.filter(b => b !== 0));
        const virtualSize = this.reader.readUInt32();
        const virtualAddress = this.reader.readUInt32();
        const rawDataSize = this.reader.readUInt32();
        const rawDataPointer = this.reader.readUInt32();
        this.reader.skip(16);

        sections.push({ name, virtualAddress, virtualSize, rawDataPointer, rawDataSize });
      }

      // Read CLR header
      const clrHeaderFileOffset = this.rvaToFileOffset(clrHeaderRVA, sections);
      if (clrHeaderFileOffset === 0) {
        return this.errorResult('Could not locate CLR header');
      }

      this.reader.setPosition(clrHeaderFileOffset);
      this.reader.skip(8);
      const metadataRVA = this.reader.readUInt32();
      const metadataSize = this.reader.readUInt32();

      return {
        isValid: true,
        isPE32Plus,
        clrHeaderRVA,
        clrHeaderSize,
        metadataRVA,
        metadataSize,
        sections
      };
    } catch (error) {
      return this.errorResult(error instanceof Error ? error.message : 'Parse error');
    }
  }

  private rvaToFileOffset(rva: number, sections: PESection[]): number {
    for (const section of sections) {
      if (rva >= section.virtualAddress && rva < section.virtualAddress + section.virtualSize) {
        return section.rawDataPointer + (rva - section.virtualAddress);
      }
    }
    return 0;
  }

  private errorResult(message: string): PEInfo {
    return {
      isValid: false,
      isPE32Plus: false,
      clrHeaderRVA: 0,
      clrHeaderSize: 0,
      metadataRVA: 0,
      metadataSize: 0,
      sections: [],
      error: message
    };
  }

  getMetadataBytes(peInfo: PEInfo): Uint8Array | null {
    if (!peInfo.isValid || peInfo.metadataRVA === 0) return null;
    const fileOffset = this.rvaToFileOffset(peInfo.metadataRVA, peInfo.sections);
    if (fileOffset === 0) return null;
    return this.data.slice(fileOffset, fileOffset + peInfo.metadataSize);
  }
}
