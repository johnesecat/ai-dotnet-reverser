// src/deobfuscation/transforms/renaming.ts

import type { Assembly, Type, Method } from '../../types/assembly';
import type { TransformResult } from './string-decrypt';

/**
 * Renaming transform
 * Suggests better names for obfuscated identifiers
 */

export class RenamingTransform {
  async apply(assembly: Assembly): Promise<TransformResult> {
    const result: TransformResult = {
      success: true,
      itemsProcessed: 0,
      itemsModified: 0,
      errors: []
    };

    try {
      // Rename obfuscated types
      for (const type of assembly.types) {
        if (type.isObfuscated) {
          result.itemsProcessed++;
          const newName = this.suggestTypeName(type, assembly);
          if (newName && newName !== type.name) {
            type.suggestedName = newName;
            result.itemsModified++;
          }
        }
      }

      // Rename obfuscated methods
      for (const method of assembly.methods) {
        if (method.isObfuscated) {
          result.itemsProcessed++;
          const newName = this.suggestMethodName(method, assembly);
          if (newName && newName !== method.name) {
            method.suggestedName = newName;
            result.itemsModified++;
          }
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private suggestTypeName(type: Type, assembly: Assembly): string | null {
    // Pattern 1: Use namespace as hint
    if (type.namespace) {
      const parts = type.namespace.split('.');
      const lastPart = parts[parts.length - 1];
      return `${lastPart}Class`;
    }

    // Pattern 2: Count method types
    const hasUI = type.methods.some(m => 
      m.name.toLowerCase().includes('button') ||
      m.name.toLowerCase().includes('click') ||
      m.name.toLowerCase().includes('load')
    );

    if (hasUI) return 'UIHandler';

    // Pattern 3: Use base class
    if (type.fullName.includes('Form')) return 'MainForm';
    if (type.fullName.includes('Dialog')) return 'DialogWindow';
    if (type.fullName.includes('Control')) return 'CustomControl';

    // Pattern 4: Sequential naming
    const typeIndex = assembly.types.indexOf(type);
    return `Class${typeIndex + 1}`;
  }

  private suggestMethodName(method: Method, assembly: Assembly): string | null {
    if (!method.ilCode) return null;

    // Pattern 1: Analyze IL operations
    const il = method.ilCode.toLowerCase();

    if (il.includes('ldstr') && il.includes('writeline')) {
      return 'WriteMessage';
    }

    if (il.includes('callvirt') && il.includes('button')) {
      return 'HandleButtonClick';
    }

    if (il.includes('ldarg.0') && il.includes('stfld')) {
      return 'SetProperty';
    }

    if (il.includes('ldfld') && il.includes('ret')) {
      return 'GetProperty';
    }

    if (il.includes('newarr')) {
      return 'CreateArray';
    }

    if (il.includes('ldelem') || il.includes('stelem')) {
      return 'AccessArray';
    }

    if (il.includes('throw')) {
      return 'ThrowException';
    }

    // Pattern 2: Check signature
    if (method.signature.includes('String') && method.signature.includes('Int32')) {
      return 'ProcessString';
    }

    if (method.signature.includes('Boolean')) {
      return 'CheckCondition';
    }

    // Pattern 3: Use position
    const methodIndex = assembly.methods.indexOf(method);
    return `Method${methodIndex + 1}`;
  }
}

// Extend type definitions
declare module '../../types/assembly' {
  interface Type {
    suggestedName?: string;
  }

  interface Method {
    suggestedName?: string;
  }
}
