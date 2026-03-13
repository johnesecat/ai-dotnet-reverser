// src/decompilers/il-to-csharp.ts

import type { Method, Type } from '../types/assembly';

export class ILToCSharpDecompiler {
  decompileMethod(method: Method, parentType: Type): string {
    const lines: string[] = [];
    
    // Method signature
    lines.push(`${method.signature}`);
    lines.push('{');
    
    // Method body
    if (method.ilCode) {
      lines.push('    // IL Code:');
      const ilLines = method.ilCode.split('\n');
      ilLines.forEach(line => {
        lines.push(`    // ${line}`);
      });
      lines.push('');
      lines.push('    // Decompiled C# (approximation):');
      
      // Simple pattern matching for common IL patterns
      const csharp = this.ilToC sharp(method.ilCode);
      csharp.split('\n').forEach(line => {
        lines.push(`    ${line}`);
      });
    } else {
      lines.push('    throw new NotImplementedException();');
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private ilToCSharp(ilCode: string): string {
    // Simplified decompilation - pattern matching
    const lines: string[] = [];
    
    // Look for common patterns
    if (ilCode.includes('ldstr')) {
      // String operations
      const match = ilCode.match(/ldstr\s+"([^"]+)"/);
      if (match) {
        lines.push(`string str = "${match[1]}";`);
      }
    }
    
    if (ilCode.includes('call') && ilCode.includes('WriteLine')) {
      lines.push('Console.WriteLine(str);');
    }
    
    if (ilCode.includes('ret')) {
      if (ilCode.includes('ldnull')) {
        lines.push('return null;');
      } else if (ilCode.includes('ldc.i4.0')) {
        lines.push('return 0;');
      } else {
        lines.push('return;');
      }
    }
    
    if (lines.length === 0) {
      lines.push('// Complex IL - manual decompilation needed');
      lines.push('throw new NotImplementedException();');
    }
    
    return lines.join('\n');
  }

  decompileType(type: Type): string {
    const lines: string[] = [];
    
    // Namespace
    if (type.namespace) {
      lines.push(`namespace ${type.namespace}`);
      lines.push('{');
    }
    
    // Class declaration
    const indent = type.namespace ? '    ' : '';
    lines.push(`${indent}public class ${type.name}`);
    lines.push(`${indent}{`);
    
    // Fields
    if (type.fields.length > 0) {
      lines.push('');
      type.fields.forEach(field => {
        lines.push(`${indent}    private ${field.type} ${field.name};`);
      });
    }
    
    // Methods
    type.methods.forEach(method => {
      lines.push('');
      const methodCode = this.decompileMethod(method, type);
      methodCode.split('\n').forEach(line => {
        lines.push(`${indent}    ${line}`);
      });
    });
    
    lines.push(`${indent}}`);
    
    if (type.namespace) {
      lines.push('}');
    }
    
    return lines.join('\n');
  }
}
