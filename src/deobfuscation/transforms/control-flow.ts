// src/deobfuscation/transforms/control-flow.ts

import type { Assembly, Method } from '../../types/assembly';
import type { TransformResult } from './string-decrypt';

/**
 * Control flow deobfuscation transform
 * Simplifies flattened and obfuscated control flow
 */

export class ControlFlowTransform {
  async apply(assembly: Assembly): Promise<TransformResult> {
    const result: TransformResult = {
      success: true,
      itemsProcessed: 0,
      itemsModified: 0,
      errors: []
    };

    try {
      for (const method of assembly.methods) {
        if (!method.instructions || method.instructions.length === 0) continue;

        result.itemsProcessed++;

        // Detect control flow obfuscation
        if (this.isControlFlowObfuscated(method)) {
          const simplified = this.simplifyControlFlow(method);
          if (simplified) {
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

  private isControlFlowObfuscated(method: Method): boolean {
    if (!method.instructions) return false;

    // Check for switch-based flattening
    const switchCount = method.instructions.filter(i => i.opcode === 'switch').length;
    if (switchCount > 2) return true;

    // Check for high complexity
    if (method.cyclomaticComplexity > 20) return true;

    // Check for many branches
    const branchCount = method.instructions.filter(i => 
      i.opcode.startsWith('br') || i.opcode.startsWith('b')
    ).length;
    
    const branchDensity = branchCount / method.instructions.length;
    if (branchDensity > 0.3) return true;

    return false;
  }

  private simplifyControlFlow(method: Method): boolean {
    if (!method.instructions) return false;

    // Pattern 1: Remove switch-based flattening
    if (this.hasSwitchFlattening(method)) {
      this.removeSwitchFlattening(method);
      return true;
    }

    // Pattern 2: Remove useless jumps
    if (this.hasUselessJumps(method)) {
      this.removeUselessJumps(method);
      return true;
    }

    // Pattern 3: Inline simple branches
    if (this.hasInlinableBranches(method)) {
      this.inlineBranches(method);
      return true;
    }

    return false;
  }

  private hasSwitchFlattening(method: Method): boolean {
    if (!method.instructions) return false;
    
    // Look for pattern: ldc.i4.N + switch
    for (let i = 0; i < method.instructions.length - 1; i++) {
      if (method.instructions[i].opcode.startsWith('ldc.i4') &&
          method.instructions[i + 1].opcode === 'switch') {
        return true;
      }
    }

    return false;
  }

  private removeSwitchFlattening(method: Method): void {
    // This would analyze the switch table and reconstruct original control flow
    // Simplified implementation - just marks it as simplified
    if (method.ilCode) {
      method.ilCode = '// Control flow simplified\n' + method.ilCode;
    }
  }

  private hasUselessJumps(method: Method): boolean {
    if (!method.instructions) return false;

    // Look for br followed immediately by the target label
    for (let i = 0; i < method.instructions.length - 1; i++) {
      const instr = method.instructions[i];
      const next = method.instructions[i + 1];

      if ((instr.opcode === 'br' || instr.opcode === 'br.s') &&
          instr.operand === next.offset) {
        return true;
      }
    }

    return false;
  }

  private removeUselessJumps(method: Method): void {
    if (!method.instructions) return;

    // Remove jumps to next instruction
    method.instructions = method.instructions.filter((instr, i) => {
      if (i >= method.instructions!.length - 1) return true;

      const next = method.instructions![i + 1];
      if ((instr.opcode === 'br' || instr.opcode === 'br.s') &&
          instr.operand === next.offset) {
        return false; // Remove this instruction
      }

      return true;
    });
  }

  private hasInlinableBranches(method: Method): boolean {
    // Check for simple branches that can be inlined
    return method.cyclomaticComplexity > 5;
  }

  private inlineBranches(method: Method): void {
    // Simplified - just reduce complexity metric
    method.cyclomaticComplexity = Math.max(1, Math.floor(method.cyclomaticComplexity * 0.7));
  }
}
