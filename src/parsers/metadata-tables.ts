// src/parsers/metadata-tables.ts

/**
 * Complete .NET metadata table definitions
 * ECMA-335 Specification
 */

export enum MetadataTable {
  Module = 0x00,
  TypeRef = 0x01,
  TypeDef = 0x02,
  Field = 0x04,
  MethodDef = 0x06,
  Param = 0x08,
  InterfaceImpl = 0x09,
  MemberRef = 0x0A,
  Constant = 0x0B,
  CustomAttribute = 0x0C,
  FieldMarshal = 0x0D,
  DeclSecurity = 0x0E,
  ClassLayout = 0x0F,
  FieldLayout = 0x10,
  StandAloneSig = 0x11,
  EventMap = 0x12,
  Event = 0x14,
  PropertyMap = 0x15,
  Property = 0x17,
  MethodSemantics = 0x18,
  MethodImpl = 0x19,
  ModuleRef = 0x1A,
  TypeSpec = 0x1B,
  ImplMap = 0x1C,
  FieldRVA = 0x1D,
  Assembly = 0x20,
  AssemblyProcessor = 0x21,
  AssemblyOS = 0x22,
  AssemblyRef = 0x23,
  AssemblyRefProcessor = 0x24,
  AssemblyRefOS = 0x25,
  File = 0x26,
  ExportedType = 0x27,
  ManifestResource = 0x28,
  NestedClass = 0x29,
  GenericParam = 0x2A,
  MethodSpec = 0x2B,
  GenericParamConstraint = 0x2C
}

export interface ModuleRow {
  generation: number;
  name: number; // String index
  mvid: number; // GUID index
  encId: number;
  encBaseId: number;
}

export interface TypeDefRow {
  flags: number;
  name: number; // String index
  namespace: number; // String index
  extends: number; // TypeDefOrRef coded index
  fieldList: number; // Field table index
  methodList: number; // MethodDef table index
}

export interface TypeRefRow {
  resolutionScope: number; // ResolutionScope coded index
  name: number; // String index
  namespace: number; // String index
}

export interface MethodDefRow {
  rva: number;
  implFlags: number;
  flags: number;
  name: number; // String index
  signature: number; // Blob index
  paramList: number; // Param table index
}

export interface FieldRow {
  flags: number;
  name: number; // String index
  signature: number; // Blob index
}

export interface ParamRow {
  flags: number;
  sequence: number;
  name: number; // String index
}

export interface PropertyRow {
  flags: number;
  name: number; // String index
  type: number; // Blob index
}

export interface EventRow {
  flags: number;
  name: number; // String index
  eventType: number; // TypeDefOrRef coded index
}

export interface CustomAttributeRow {
  parent: number; // HasCustomAttribute coded index
  type: number; // CustomAttributeType coded index
  value: number; // Blob index
}

export interface ManifestResourceRow {
  offset: number;
  flags: number;
  name: number; // String index
  implementation: number; // Implementation coded index
}

export interface AssemblyRow {
  hashAlgId: number;
  majorVersion: number;
  minorVersion: number;
  buildNumber: number;
  revisionNumber: number;
  flags: number;
  publicKey: number; // Blob index
  name: number; // String index
  culture: number; // String index
}

export interface AssemblyRefRow {
  majorVersion: number;
  minorVersion: number;
  buildNumber: number;
  revisionNumber: number;
  flags: number;
  publicKeyOrToken: number; // Blob index
  name: number; // String index
  culture: number; // String index
  hashValue: number; // Blob index
}

// Type attributes
export enum TypeAttributes {
  VisibilityMask = 0x00000007,
  NotPublic = 0x00000000,
  Public = 0x00000001,
  NestedPublic = 0x00000002,
  NestedPrivate = 0x00000003,
  NestedFamily = 0x00000004,
  NestedAssembly = 0x00000005,
  NestedFamANDAssem = 0x00000006,
  NestedFamORAssem = 0x00000007,
  
  LayoutMask = 0x00000018,
  AutoLayout = 0x00000000,
  SequentialLayout = 0x00000008,
  ExplicitLayout = 0x00000010,
  
  ClassSemanticsMask = 0x00000020,
  Class = 0x00000000,
  Interface = 0x00000020,
  
  Abstract = 0x00000080,
  Sealed = 0x00000100,
  SpecialName = 0x00000400,
  
  Import = 0x00001000,
  Serializable = 0x00002000,
  
  StringFormatMask = 0x00030000,
  AnsiClass = 0x00000000,
  UnicodeClass = 0x00010000,
  AutoClass = 0x00020000,
  
  BeforeFieldInit = 0x00100000,
  RTSpecialName = 0x00000800,
}

// Method attributes
export enum MethodAttributes {
  MemberAccessMask = 0x0007,
  PrivateScope = 0x0000,
  Private = 0x0001,
  FamANDAssem = 0x0002,
  Assembly = 0x0003,
  Family = 0x0004,
  FamORAssem = 0x0005,
  Public = 0x0006,
  
  Static = 0x0010,
  Final = 0x0020,
  Virtual = 0x0040,
  HideBySig = 0x0080,
  
  VtableLayoutMask = 0x0100,
  ReuseSlot = 0x0000,
  NewSlot = 0x0100,
  
  Abstract = 0x0400,
  SpecialName = 0x0800,
  
  PInvokeImpl = 0x2000,
  RTSpecialName = 0x1000,
}

// Field attributes
export enum FieldAttributes {
  FieldAccessMask = 0x0007,
  PrivateScope = 0x0000,
  Private = 0x0001,
  FamANDAssem = 0x0002,
  Assembly = 0x0003,
  Family = 0x0004,
  FamORAssem = 0x0005,
  Public = 0x0006,
  
  Static = 0x0010,
  InitOnly = 0x0020,
  Literal = 0x0040,
  NotSerialized = 0x0080,
  SpecialName = 0x0200,
  
  PInvokeImpl = 0x2000,
  RTSpecialName = 0x0400,
}
