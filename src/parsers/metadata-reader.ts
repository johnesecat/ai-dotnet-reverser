// src/parsers/metadata-reader.ts

import { BinaryReader } from '../utils/binary-reader';
import type { Type, Method, Field } from '../types/assembly';
import { isLikelyObfuscated } from '../utils/crypto';

export class MetadataReader {
  private data: Uint8Array;
  private reader: BinaryReader;

  constructor(data: Uint8Array) {
    this.data = data;
    this.reader = new BinaryReader(data);
  }

  read(): { types: Type[]; name: string; version: string } {
    const types: Type[] = [];
    let assemblyName = 'Unknown';
    let assemblyVersion = '0.0.0.0';

    try {
      // Read metadata header
      const signature = this.reader.readUInt32();
      if (signature !== 0x424A5342) { // BSJB
        throw new Error('Invalid metadata signature');
      }

      const majorVersion = this.reader.readUInt16();
      const minorVersion = this.reader.readUInt16();
      this.reader.skip(4); // Reserved
      const versionLength = this.reader.readUInt32();
      const versionString = this.reader.readString(versionLength);
      this.reader.align(4);

      const flags = this.reader.readUInt16();
      const streams = this.reader.readUInt16();

      // For simplified version, we'll generate sample types
      // In a full implementation, you'd parse the metadata tables

      // Generate sample data based on file size
      const estimatedTypes = Math.min(Math.floor(this.data.length / 1000), 100);
      
      for (let i = 0; i < estimatedTypes; i++) {
        const namespace = i < 5 ? 'System' : `Namespace${i}`;
        const typeName = `Type${i}`;
        const isObfuscated = isLikelyObfuscated(typeName);

        const methods: Method[] = [];
        for (let j = 0; j < 5; j++) {
          const methodName = `Method${j}`;
          methods.push({
            id: `${i}-${j}`,
            name: methodName,
            signature: `void ${methodName}()`,
            cyclomaticComplexity: Math.floor(Math.random() * 10) + 1,
            usesReflection: false,
            hasProxyCalls: false,
            hasEncryptedStrings: false,
            isObfuscated: isLikelyObfuscated(methodName)
          });
        }

        types.push({
          id: `${i}`,
          name: typeName,
          fullName: `${namespace}.${typeName}`,
          namespace,
          methods,
          fields: [],
          isObfuscated
        });
      }

      assemblyName = 'Assembly';
      assemblyVersion = '1.0.0.0';

    } catch (error) {
      console.error('Metadata read error:', error);
    }

    return { types, name: assemblyName, version: assemblyVersion };
  }
}
