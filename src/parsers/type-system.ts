// src/parsers/type-system.ts

import type { Type, Method, Field } from '../types/assembly';
import { TypeAttributes, MethodAttributes, FieldAttributes } from './metadata-tables';

/**
 * Builds a complete type system from metadata tables
 */

export class TypeSystemBuilder {
  buildTypes(
    typeDefRows: any[],
    methodDefRows: any[],
    fieldRows: any[],
    stringHeap: (index: number) => string
  ): Type[] {
    const types: Type[] = [];

    for (let i = 0; i < typeDefRows.length; i++) {
      const typeDef = typeDefRows[i];
      const type = this.buildType(typeDef, i, typeDefRows, methodDefRows, fieldRows, stringHeap);
      
      if (type && type.name !== '<Module>') {
        types.push(type);
      }
    }

    return types;
  }

  private buildType(
    typeDef: any,
    index: number,
    allTypeDefs: any[],
    methodDefRows: any[],
    fieldRows: any[],
    stringHeap: (index: number) => string
  ): Type | null {
    const name = stringHeap(typeDef.name);
    const namespace = stringHeap(typeDef.namespace);
    
    // Skip <Module> type
    if (name === '<Module>') return null;

    // Build methods
    const methods = this.buildMethods(
      typeDef,
      index,
      allTypeDefs,
      methodDefRows,
      stringHeap
    );

    // Build fields
    const fields = this.buildFields(
      typeDef,
      index,
      allTypeDefs,
      fieldRows,
      stringHeap
    );

    // Get type attributes
    const attrs = this.parseTypeAttributes(typeDef.flags);

    return {
      id: `type_${index}`,
      name,
      fullName: namespace ? `${namespace}.${name}` : name,
      namespace: namespace || '',
      methods,
      fields,
      isObfuscated: this.isObfuscatedName(name),
      attributes: attrs,
      isPublic: (typeDef.flags & TypeAttributes.Public) !== 0,
      isSealed: (typeDef.flags & TypeAttributes.Sealed) !== 0,
      isAbstract: (typeDef.flags & TypeAttributes.Abstract) !== 0,
      isInterface: (typeDef.flags & TypeAttributes.Interface) !== 0
    };
  }

  private buildMethods(
    typeDef: any,
    typeIndex: number,
    allTypeDefs: any[],
    methodDefRows: any[],
    stringHeap: (index: number) => string
  ): Method[] {
    const methods: Method[] = [];

    // Get method range for this type
    const methodStart = typeDef.methodList - 1;
    const methodEnd = typeIndex + 1 < allTypeDefs.length
      ? allTypeDefs[typeIndex + 1].methodList - 1
      : methodDefRows.length;

    for (let i = methodStart; i < methodEnd && i < methodDefRows.length; i++) {
      if (i < 0) continue;

      const methodDef = methodDefRows[i];
      const method = this.buildMethod(methodDef, i, stringHeap);
      methods.push(method);
    }

    return methods;
  }

  private buildMethod(
    methodDef: any,
    index: number,
    stringHeap: (index: number) => string
  ): Method {
    const name = stringHeap(methodDef.name);
    const signature = this.buildMethodSignature(methodDef, name, stringHeap);

    return {
      id: `method_${index}`,
      name,
      signature,
      rva: methodDef.rva,
      implFlags: methodDef.implFlags,
      flags: methodDef.flags,
      cyclomaticComplexity: 1,
      usesReflection: false,
      hasProxyCalls: false,
      hasEncryptedStrings: false,
      isObfuscated: this.isObfuscatedName(name),
      isPublic: (methodDef.flags & MethodAttributes.Public) !== 0,
      isPrivate: (methodDef.flags & MethodAttributes.Private) !== 0,
      isStatic: (methodDef.flags & MethodAttributes.Static) !== 0,
      isVirtual: (methodDef.flags & MethodAttributes.Virtual) !== 0,
      isAbstract: (methodDef.flags & MethodAttributes.Abstract) !== 0
    };
  }

  private buildMethodSignature(
    methodDef: any,
    name: string,
    stringHeap: (index: number) => string
  ): string {
    let sig = '';

    // Access modifier
    const access = methodDef.flags & MethodAttributes.MemberAccessMask;
    if (access === MethodAttributes.Public) sig += 'public ';
    else if (access === MethodAttributes.Private) sig += 'private ';
    else if (access === MethodAttributes.Family) sig += 'protected ';
    else if (access === MethodAttributes.Assembly) sig += 'internal ';

    // Modifiers
    if (methodDef.flags & MethodAttributes.Static) sig += 'static ';
    if (methodDef.flags & MethodAttributes.Abstract) sig += 'abstract ';
    else if (methodDef.flags & MethodAttributes.Virtual) sig += 'virtual ';
    if (methodDef.flags & MethodAttributes.Final) sig += 'sealed ';

    // Return type (simplified - would need signature parsing)
    sig += 'void ';

    // Method name
    sig += name;

    // Parameters (simplified)
    sig += '()';

    return sig;
  }

  private buildFields(
    typeDef: any,
    typeIndex: number,
    allTypeDefs: any[],
    fieldRows: any[],
    stringHeap: (index: number) => string
  ): Field[] {
    const fields: Field[] = [];

    // Get field range for this type
    const fieldStart = typeDef.fieldList - 1;
    const fieldEnd = typeIndex + 1 < allTypeDefs.length
      ? allTypeDefs[typeIndex + 1].fieldList - 1
      : fieldRows.length;

    for (let i = fieldStart; i < fieldEnd && i < fieldRows.length; i++) {
      if (i < 0) continue;

      const fieldDef = fieldRows[i];
      const field = this.buildField(fieldDef, stringHeap);
      fields.push(field);
    }

    return fields;
  }

  private buildField(
    fieldDef: any,
    stringHeap: (index: number) => string
  ): Field {
    const name = stringHeap(fieldDef.name);

    return {
      name,
      type: 'object', // Simplified - would need signature parsing
      isPublic: (fieldDef.flags & FieldAttributes.Public) !== 0,
      isPrivate: (fieldDef.flags & FieldAttributes.Private) !== 0,
      isStatic: (fieldDef.flags & FieldAttributes.Static) !== 0,
      isReadOnly: (fieldDef.flags & FieldAttributes.InitOnly) !== 0,
      isLiteral: (fieldDef.flags & FieldAttributes.Literal) !== 0
    };
  }

  private parseTypeAttributes(flags: number): string[] {
    const attrs: string[] = [];

    if (flags & TypeAttributes.Public) attrs.push('public');
    if (flags & TypeAttributes.Sealed) attrs.push('sealed');
    if (flags & TypeAttributes.Abstract) attrs.push('abstract');
    if (flags & TypeAttributes.Interface) attrs.push('interface');
    if (flags & TypeAttributes.Serializable) attrs.push('serializable');

    return attrs;
  }

  private isObfuscatedName(name: string): boolean {
    // Very short names
    if (name.length <= 2 && /^[a-zA-Z]+$/.test(name)) return true;

    // Single character
    if (name.length === 1) return true;

    // Contains special unicode
    if (/[\u200b-\u200f\u202a-\u202e\ufeff]/.test(name)) return true;

    // All numbers
    if (/^\d+$/.test(name)) return true;

    // Chinese characters (common obfuscation)
    if (/[\u4e00-\u9fa5]/.test(name)) return true;

    // High entropy
    const entropy = this.calculateEntropy(name);
    if (entropy > 4.5) return true;

    return false;
  }

  private calculateEntropy(str: string): number {
    if (!str) return 0;

    const freq: { [key: string]: number } = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}
