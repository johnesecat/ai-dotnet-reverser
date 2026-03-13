// src/parsers/clr-metadata.ts

import { BinaryReader } from '../utils/binary-reader';

/**
 * CLR (Common Language Runtime) metadata parser
 * Handles the .NET metadata root structure
 */

export class CLRMetadataParser {
  private reader: BinaryReader;
  private metadataRoot!: MetadataRoot;
  private streamHeaders: Map<string, StreamHeader> = new Map();

  constructor(data: Uint8Array) {
    this.reader = new BinaryReader(data);
  }

  parse(): CLRMetadata {
    try {
      this.parseMetadataRoot();
      this.parseStreamHeaders();
      
      return {
        root: this.metadataRoot,
        streams: this.streamHeaders,
        isValid: true
      };
    } catch (error) {
      console.error('CLR metadata parse error:', error);
      return {
        root: this.createEmptyRoot(),
        streams: new Map(),
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseMetadataRoot(): void {
    // Read metadata signature (BSJB = 0x424A5342)
    const signature = this.reader.readUInt32();
    if (signature !== 0x424A5342) {
      throw new Error(`Invalid metadata signature: 0x${signature.toString(16)}`);
    }

    this.metadataRoot = {
      signature,
      majorVersion: this.reader.readUInt16(),
      minorVersion: this.reader.readUInt16(),
      reserved: this.reader.readUInt32(),
      versionLength: 0,
      version: '',
      flags: 0,
      numberOfStreams: 0
    };

    // Read version string length
    this.metadataRoot.versionLength = this.reader.readUInt32();
    
    // Read version string (null-padded to 4-byte boundary)
    this.metadataRoot.version = this.reader.readString(this.metadataRoot.versionLength);
    
    // Align to 4-byte boundary
    this.reader.align(4);

    // Read flags and number of streams
    this.metadataRoot.flags = this.reader.readUInt16();
    this.metadataRoot.numberOfStreams = this.reader.readUInt16();
  }

  private parseStreamHeaders(): void {
    for (let i = 0; i < this.metadataRoot.numberOfStreams; i++) {
      const offset = this.reader.readUInt32();
      const size = this.reader.readUInt32();
      const name = this.reader.readCString();
      
      // Align to 4-byte boundary
      this.reader.align(4);

      this.streamHeaders.set(name, {
        offset,
        size,
        name
      });
    }
  }

  private createEmptyRoot(): MetadataRoot {
    return {
      signature: 0,
      majorVersion: 0,
      minorVersion: 0,
      reserved: 0,
      versionLength: 0,
      version: '',
      flags: 0,
      numberOfStreams: 0
    };
  }

  getStream(name: string): StreamHeader | undefined {
    return this.streamHeaders.get(name);
  }

  hasStream(name: string): boolean {
    return this.streamHeaders.has(name);
  }

  getVersion(): string {
    return this.metadataRoot.version;
  }

  isCompressed(): boolean {
    // Check if streams are compressed
    return this.hasStream('#~'); // Compressed metadata
  }

  isUncompressed(): boolean {
    return this.hasStream('#-'); // Uncompressed metadata
  }
}

export interface MetadataRoot {
  signature: number;
  majorVersion: number;
  minorVersion: number;
  reserved: number;
  versionLength: number;
  version: string;
  flags: number;
  numberOfStreams: number;
}

export interface StreamHeader {
  offset: number;
  size: number;
  name: string;
}

export interface CLRMetadata {
  root: MetadataRoot;
  streams: Map<string, StreamHeader>;
  isValid: boolean;
  error?: string;
}
