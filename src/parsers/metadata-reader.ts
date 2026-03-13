// src/parsers/metadata-reader.ts

import { BinaryReader } from '../utils/binary-reader';
import { 
  MetadataTable, TypeDefRow, MethodDefRow, FieldRow, TypeRefRow,
  AssemblyRow, AssemblyRefRow, ManifestResourceRow, CustomAttributeRow,
  TypeAttributes, MethodAttributes, FieldAttributes
} from './metadata-tables';
import type { Type, Method, Field, Assembly } from '../types/assembly';
import { isLikelyObfuscated } from '../utils/crypto';

interface MetadataHeader {
  signature: number;
  majorVersion: number;
  minorVersion: number;
  reserved: number;
  versionLength: number;
  versionString: string;
  flags: number;
  streams: number;
}

interface StreamHeader {
  offset: number;
  size: number;
  name: string;
}

interface HeapSizes {
  string: number;
  guid: number;
  blob: number;
}

export class MetadataReader {
  private data: Uint8Array;
  private reader: BinaryReader;
  private header!: MetadataHeader;
  private streams: Map<string, StreamHeader> = new Map();
  
  // Heaps
  private stringsHeap: Uint8Array = new Uint8Array(0);
  private blobHeap: Uint8Array = new Uint8Array(0);
  private guidHeap: Uint8Array = new Uint8Array(0);
  private usHeap: Uint8Array = new Uint8Array(0);
  
  // Metadata tables
  private tables: Map<MetadataTable, any[]> = new Map();
  private tableRowCounts: Map<MetadataTable, number> = new Map();
  private heapSizes!: HeapSizes;

  constructor(data: Uint8Array) {
    this.data = data;
    this.reader = new BinaryReader(data);
  }

  read(): { types: Type[]; name: string; version: string; resources: Resource[] } {
    try {
      // Read metadata header
      this.readHeader();
      
      // Read stream headers
      this.readStreamHeaders();
      
      // Load heaps
      this.loadHeaps();
      
      // Read metadata tables
      this.readTables();
      
      // Build type system
      const types = this.buildTypes();
      
      // Get assembly info
      const assemblyInfo = this.getAssemblyInfo();
      
      // Extract resources
      const resources = this.extractResources();
      
      return {
        types,
        name: assemblyInfo.name,
        version: assemblyInfo.version,
        resources
      };
    } catch (error) {
      console.error('Metadata parsing error:', error);
      // Return minimal data
      return {
        types: [],
        name: 'Unknown',
        version: '0.0.0.0',
        resources: []
      };
    }
  }

  private readHeader(): void {
    const signature = this.reader.readUInt32();
    if (signature !== 0x424A5342) { // BSJB
      throw new Error('Invalid metadata signature');
    }

    this.header = {
      signature,
      majorVersion: this.reader.readUInt16(),
      minorVersion: this.reader.readUInt16(),
      reserved: this.reader.readUInt32(),
      versionLength: this.reader.readUInt32(),
      versionString: '',
      flags: 0,
      streams: 0
    };

    this.header.versionString = this.reader.readString(this.header.versionLength);
    this.reader.align(4);

    this.header.flags = this.reader.readUInt16();
    this.header.streams = this.reader.readUInt16();
  }

  private readStreamHeaders(): void {
    for (let i = 0; i < this.header.streams; i++) {
      const offset = this.reader.readUInt32();
      const size = this.reader.readUInt32();
      const name = this.reader.readCString();
      this.reader.align(4);

      this.streams.set(name, { offset, size, name });
    }
  }

  private loadHeaps(): void {
    const metadataStart = this.reader.getPosition() - this.calculateHeaderSize();

    // Strings heap
    const stringsStream = this.streams.get('#Strings');
    if (stringsStream) {
      const start = metadataStart + stringsStream.offset;
      this.stringsHeap = this.data.slice(start, start + stringsStream.size);
    }

    // Blob heap
    const blobStream = this.streams.get('#Blob');
    if (blobStream) {
      const start = metadataStart + blobStream.offset;
      this.blobHeap = this.data.slice(start, start + blobStream.size);
    }

    // GUID heap
    const guidStream = this.streams.get('#GUID');
    if (guidStream) {
      const start = metadataStart + guidStream.offset;
      this.guidHeap = this.data.slice(start, start + guidStream.size);
    }

    // US (User Strings) heap
    const usStream = this.streams.get('#US');
    if (usStream) {
      const start = metadataStart + usStream.offset;
      this.usHeap = this.data.slice(start, start + usStream.size);
    }
  }

  private calculateHeaderSize(): number {
    // Signature (4) + major/minor (4) + reserved (4) + versionLength (4)
    let size = 16;
    size += this.header.versionLength;
    size = Math.ceil(size / 4) * 4; // Align
    size += 4; // flags + streams
    
    // Stream headers
    for (const stream of this.streams.values()) {
      size += 8; // offset + size
      size += stream.name.length + 1; // name + null
      size = Math.ceil(size / 4) * 4; // Align
    }
    
    return size;
  }

  private readTables(): void {
    const tablesStream = this.streams.get('#~') || this.streams.get('#-');
    if (!tablesStream) {
      throw new Error('Metadata tables stream not found');
    }

    const metadataStart = this.reader.getPosition() - this.calculateHeaderSize();
    this.reader.setPosition(metadataStart + tablesStream.offset);

    // Read table stream header
    const reserved = this.reader.readUInt32();
    const majorVersion = this.reader.readByte();
    const minorVersion = this.reader.readByte();
    const heapSizes = this.reader.readByte();
    const reserved2 = this.reader.readByte();
    const valid = this.reader.readUInt32();
    const validHi = this.reader.readUInt32();
    const sorted = this.reader.readUInt32();
    const sortedHi = this.reader.readUInt32();

    this.heapSizes = {
      string: (heapSizes & 0x01) !== 0 ? 4 : 2,
      guid: (heapSizes & 0x02) !== 0 ? 4 : 2,
      blob: (heapSizes & 0x04) !== 0 ? 4 : 2
    };

    // Read row counts
    for (let i = 0; i < 64; i++) {
      if ((valid & (1 << i)) !== 0 || (i >= 32 && (validHi & (1 << (i - 32))) !== 0)) {
        const rowCount = this.reader.readUInt32();
        this.tableRowCounts.set(i, rowCount);
      }
    }

    // Read tables
    this.readTypeDef();
    this.readTypeRef();
    this.readMethodDef();
    this.readField();
    this.readAssembly();
    this.readAssemblyRef();
    this.readManifestResource();
  }

  private readTypeDef(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.TypeDef) || 0;
    const rows: TypeDefRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        flags: this.reader.readUInt32(),
        name: this.readStringIndex(),
        namespace: this.readStringIndex(),
        extends: this.readCodedIndex('TypeDefOrRef'),
        fieldList: this.readTableIndex(MetadataTable.Field),
        methodList: this.readTableIndex(MetadataTable.MethodDef)
      });
    }

    this.tables.set(MetadataTable.TypeDef, rows);
  }

  private readTypeRef(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.TypeRef) || 0;
    const rows: TypeRefRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        resolutionScope: this.readCodedIndex('ResolutionScope'),
        name: this.readStringIndex(),
        namespace: this.readStringIndex()
      });
    }

    this.tables.set(MetadataTable.TypeRef, rows);
  }

  private readMethodDef(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.MethodDef) || 0;
    const rows: MethodDefRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        rva: this.reader.readUInt32(),
        implFlags: this.reader.readUInt16(),
        flags: this.reader.readUInt16(),
        name: this.readStringIndex(),
        signature: this.readBlobIndex(),
        paramList: this.readTableIndex(MetadataTable.Param)
      });
    }

    this.tables.set(MetadataTable.MethodDef, rows);
  }

  private readField(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.Field) || 0;
    const rows: FieldRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        flags: this.reader.readUInt16(),
        name: this.readStringIndex(),
        signature: this.readBlobIndex()
      });
    }

    this.tables.set(MetadataTable.Field, rows);
  }

  private readAssembly(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.Assembly) || 0;
    if (rowCount === 0) return;

    const row: AssemblyRow = {
      hashAlgId: this.reader.readUInt32(),
      majorVersion: this.reader.readUInt16(),
      minorVersion: this.reader.readUInt16(),
      buildNumber: this.reader.readUInt16(),
      revisionNumber: this.reader.readUInt16(),
      flags: this.reader.readUInt32(),
      publicKey: this.readBlobIndex(),
      name: this.readStringIndex(),
      culture: this.readStringIndex()
    };

    this.tables.set(MetadataTable.Assembly, [row]);
  }

  private readAssemblyRef(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.AssemblyRef) || 0;
    const rows: AssemblyRefRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        majorVersion: this.reader.readUInt16(),
        minorVersion: this.reader.readUInt16(),
        buildNumber: this.reader.readUInt16(),
        revisionNumber: this.reader.readUInt16(),
        flags: this.reader.readUInt32(),
        publicKeyOrToken: this.readBlobIndex(),
        name: this.readStringIndex(),
        culture: this.readStringIndex(),
        hashValue: this.readBlobIndex()
      });
    }

    this.tables.set(MetadataTable.AssemblyRef, rows);
  }

  private readManifestResource(): void {
    const rowCount = this.tableRowCounts.get(MetadataTable.ManifestResource) || 0;
    const rows: ManifestResourceRow[] = [];

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        offset: this.reader.readUInt32(),
        flags: this.reader.readUInt32(),
        name: this.readStringIndex(),
        implementation: this.readCodedIndex('Implementation')
      });
    }

    this.tables.set(MetadataTable.ManifestResource, rows);
  }

  private readStringIndex(): number {
    return this.heapSizes.string === 4 
      ? this.reader.readUInt32() 
      : this.reader.readUInt16();
  }

  private readBlobIndex(): number {
    return this.heapSizes.blob === 4 
      ? this.reader.readUInt32() 
      : this.reader.readUInt16();
  }

  private readGuidIndex(): number {
    return this.heapSizes.guid === 4 
      ? this.reader.readUInt32() 
      : this.reader.readUInt16();
  }

  private readTableIndex(table: MetadataTable): number {
    const rowCount = this.tableRowCounts.get(table) || 0;
    return rowCount > 65535 ? this.reader.readUInt32() : this.reader.readUInt16();
  }

  private readCodedIndex(coding: string): number {
    // Simplified - in full implementation, calculate based on tag bits
    return this.reader.readUInt16();
  }

  getString(index: number): string {
    if (index === 0 || index >= this.stringsHeap.length) return '';
    
    const reader = new BinaryReader(this.stringsHeap, index);
    return reader.readCString();
  }

  getBlob(index: number): Uint8Array {
    if (index === 0 || index >= this.blobHeap.length) return new Uint8Array(0);
    
    const reader = new BinaryReader(this.blobHeap, index);
    const length = reader.readCompressedUInt();
    return reader.readBytes(length);
  }

  private buildTypes(): Type[] {
    const typeDefRows = this.tables.get(MetadataTable.TypeDef) as TypeDefRow[] || [];
    const methodDefRows = this.tables.get(MetadataTable.MethodDef) as MethodDefRow[] || [];
    const fieldRows = this.tables.get(MetadataTable.Field) as FieldRow[] || [];
    
    const types: Type[] = [];

    for (let i = 0; i < typeDefRows.length; i++) {
      const typeDef = typeDefRows[i];
      const name = this.getString(typeDef.name);
      const namespace = this.getString(typeDef.namespace);
      
      // Skip <Module> type
      if (name === '<Module>') continue;

      // Get methods for this type
      const methodStart = typeDef.methodList - 1;
      const methodEnd = i + 1 < typeDefRows.length 
        ? typeDefRows[i + 1].methodList - 1 
        : methodDefRows.length;

      const methods: Method[] = [];
      for (let j = methodStart; j < methodEnd; j++) {
        if (j >= 0 && j < methodDefRows.length) {
          const methodDef = methodDefRows[j];
          const methodName = this.getString(methodDef.name);
          
          methods.push({
            id: `${i}-${j}`,
            name: methodName,
            signature: this.buildMethodSignature(methodDef),
            cyclomaticComplexity: 1,
            usesReflection: false,
            hasProxyCalls: false,
            hasEncryptedStrings: false,
            isObfuscated: isLikelyObfuscated(methodName)
          });
        }
      }

      // Get fields for this type
      const fieldStart = typeDef.fieldList - 1;
      const fieldEnd = i + 1 < typeDefRows.length 
        ? typeDefRows[i + 1].fieldList - 1 
        : fieldRows.length;

      const fields: Field[] = [];
      for (let j = fieldStart; j < fieldEnd; j++) {
        if (j >= 0 && j < fieldRows.length) {
          const fieldDef = fieldRows[j];
          fields.push({
            name: this.getString(fieldDef.name),
            type: 'object' // Simplified
          });
        }
      }

      types.push({
        id: `${i}`,
        name,
        fullName: namespace ? `${namespace}.${name}` : name,
        namespace,
        methods,
        fields,
        isObfuscated: isLikelyObfuscated(name)
      });
    }

    return types;
  }

  private buildMethodSignature(methodDef: MethodDefRow): string {
    const name = this.getString(methodDef.name);
    const flags = methodDef.flags;
    
    let signature = '';
    
    // Access modifier
    const access = flags & MethodAttributes.MemberAccessMask;
    if (access === MethodAttributes.Public) signature += 'public ';
    else if (access === MethodAttributes.Private) signature += 'private ';
    else if (access === MethodAttributes.Family) signature += 'protected ';
    else if (access === MethodAttributes.Assembly) signature += 'internal ';
    
    // Static
    if (flags & MethodAttributes.Static) signature += 'static ';
    
    // Virtual/Abstract
    if (flags & MethodAttributes.Abstract) signature += 'abstract ';
    else if (flags & MethodAttributes.Virtual) signature += 'virtual ';
    
    // Return type (simplified)
    signature += 'void ';
    
    // Method name
    signature += name;
    
    // Parameters (simplified)
    signature += '()';
    
    return signature;
  }

  private getAssemblyInfo(): { name: string; version: string } {
    const assemblyRows = this.tables.get(MetadataTable.Assembly) as AssemblyRow[];
    
    if (assemblyRows && assemblyRows.length > 0) {
      const assembly = assemblyRows[0];
      return {
        name: this.getString(assembly.name),
        version: `${assembly.majorVersion}.${assembly.minorVersion}.${assembly.buildNumber}.${assembly.revisionNumber}`
      };
    }
    
    return { name: 'Unknown', version: '0.0.0.0' };
  }

  private extractResources(): Resource[] {
    const resourceRows = this.tables.get(MetadataTable.ManifestResource) as ManifestResourceRow[] || [];
    const resources: Resource[] = [];

    for (const resource of resourceRows) {
      const name = this.getString(resource.name);
      const isEmbedded = resource.implementation === 0;
      
      if (isEmbedded) {
        resources.push({
          name,
          type: this.getResourceType(name),
          size: 0, // Would need to read from resources section
          data: null
        });
      }
    }

    return resources;
  }

  private getResourceType(name: string): string {
    if (name.endsWith('.baml')) return 'BAML';
    if (name.endsWith('.xaml')) return 'XAML';
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.ico')) return 'Image';
    if (name.endsWith('.resx')) return 'ResX';
    return 'Unknown';
  }
}

export interface Resource {
  name: string;
  type: string;
  size: number;
  data: Uint8Array | null;
}
