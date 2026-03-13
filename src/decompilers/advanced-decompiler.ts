// src/decompilers/advanced-decompiler.ts

import type { Method, ILInstruction } from '../types/assembly';

/**
 * Advanced IL to C# decompiler with control flow analysis
 */

interface BasicBlock {
  id: number;
  start: number;
  end: number;
  instructions: ILInstruction[];
  successors: number[];
  predecessors: number[];
}

interface ControlFlowGraph {
  blocks: BasicBlock[];
  entryBlock: number;
  exitBlocks: number[];
}

export class AdvancedDecompiler {
  decompileMethod(method: Method): DecompiledMethod {
    if (!method.instructions || method.instructions.length === 0) {
      return {
        csharp: this.generateStub(method),
        cfg: null,
        variables: [],
        complexity: 1
      };
    }

    // Build control flow graph
    const cfg = this.buildCFG(method.instructions);

    // Analyze variables
    const variables = this.analyzeVariables(method.instructions);

    // Decompile to C#
    const csharp = this.generateCSharp(cfg, variables, method);

    return {
      csharp,
      cfg,
      variables,
      complexity: cfg.blocks.length
    };
  }

  private buildCFG(instructions: ILInstruction[]): ControlFlowGraph {
    const blocks: BasicBlock[] = [];
    const leaders = new Set<number>([0]); // First instruction is always a leader

    // Find leaders (start of basic blocks)
    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];
      
      // Branch targets are leaders
      if (this.isBranch(instr.opcode)) {
        if (instr.operand !== undefined) {
          leaders.add(instr.operand);
        }
        // Instruction after branch is also a leader
        if (i + 1 < instructions.length) {
          leaders.add(instructions[i + 1].offset);
        }
      }

      // Instruction after throw/return is a leader
      if (instr.opcode === 'throw' || instr.opcode === 'ret') {
        if (i + 1 < instructions.length) {
          leaders.add(instructions[i + 1].offset);
        }
      }
    }

    // Create basic blocks
    const leaderArray = Array.from(leaders).sort((a, b) => a - b);
    for (let i = 0; i < leaderArray.length; i++) {
      const start = leaderArray[i];
      const end = i + 1 < leaderArray.length 
        ? leaderArray[i + 1] 
        : instructions[instructions.length - 1].offset + 1;

      const blockInstructions = instructions.filter(
        instr => instr.offset >= start && instr.offset < end
      );

      blocks.push({
        id: i,
        start,
        end,
        instructions: blockInstructions,
        successors: [],
        predecessors: []
      });
    }

    // Build edges
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const lastInstr = block.instructions[block.instructions.length - 1];

      if (!lastInstr) continue;

      // Unconditional branch
      if (lastInstr.opcode === 'br' || lastInstr.opcode === 'br.s') {
        const targetBlock = blocks.findIndex(b => b.start === lastInstr.operand);
        if (targetBlock >= 0) {
          block.successors.push(targetBlock);
          blocks[targetBlock].predecessors.push(i);
        }
      }
      // Conditional branch
      else if (this.isConditionalBranch(lastInstr.opcode)) {
        // Branch target
        const targetBlock = blocks.findIndex(b => b.start === lastInstr.operand);
        if (targetBlock >= 0) {
          block.successors.push(targetBlock);
          blocks[targetBlock].predecessors.push(i);
        }
        // Fall through
        if (i + 1 < blocks.length) {
          block.successors.push(i + 1);
          blocks[i + 1].predecessors.push(i);
        }
      }
      // Return/throw - no successors
      else if (lastInstr.opcode === 'ret' || lastInstr.opcode === 'throw') {
        // No successors
      }
      // Fall through to next block
      else if (i + 1 < blocks.length) {
        block.successors.push(i + 1);
        blocks[i + 1].predecessors.push(i);
      }
    }

    const exitBlocks = blocks
      .map((b, i) => ({ block: b, index: i }))
      .filter(({ block }) => block.successors.length === 0)
      .map(({ index }) => index);

    return {
      blocks,
      entryBlock: 0,
      exitBlocks
    };
  }

  private isBranch(opcode: string): boolean {
    return opcode.startsWith('br') || 
           opcode.startsWith('beq') || 
           opcode.startsWith('bne') ||
           opcode.startsWith('blt') || 
           opcode.startsWith('bge') ||
           opcode.startsWith('bgt') || 
           opcode.startsWith('ble');
  }

  private isConditionalBranch(opcode: string): boolean {
    return this.isBranch(opcode) && !opcode.startsWith('br.') && opcode !== 'br';
  }

  private analyzeVariables(instructions: ILInstruction[]): Variable[] {
    const variables: Variable[] = [];
    const localCount = this.countLocals(instructions);

    for (let i = 0; i < localCount; i++) {
      variables.push({
        index: i,
        name: `local${i}`,
        type: 'object', // Would need type inference
        usages: this.findVariableUsages(i, instructions)
      });
    }

    return variables;
  }

  private countLocals(instructions: ILInstruction[]): number {
    let maxLocal = 0;
    for (const instr of instructions) {
      if (instr.opcode.startsWith('ldloc') || instr.opcode.startsWith('stloc')) {
        const match = instr.opcode.match(/\.(\d+)$/);
        if (match) {
          maxLocal = Math.max(maxLocal, parseInt(match[1]) + 1);
        }
      }
    }
    return maxLocal;
  }

  private findVariableUsages(index: number, instructions: ILInstruction[]): number[] {
    const usages: number[] = [];
    for (const instr of instructions) {
      if (instr.opcode === `ldloc.${index}` || instr.opcode === `stloc.${index}`) {
        usages.push(instr.offset);
      }
    }
    return usages;
  }

  private generateCSharp(cfg: ControlFlowGraph, variables: Variable[], method: Method): string {
    const lines: string[] = [];

    // Variable declarations
    if (variables.length > 0) {
      lines.push('// Local variables:');
      variables.forEach(v => {
        lines.push(`${v.type} ${v.name};`);
      });
      lines.push('');
    }

    // Detect patterns and generate code
    if (this.isSimpleReturn(cfg)) {
      const returnValue = this.extractReturnValue(cfg.blocks[0].instructions);
      lines.push(`return ${returnValue};`);
    }
    else if (this.isSimpleIfElse(cfg)) {
      lines.push(...this.generateIfElse(cfg));
    }
    else if (this.isLoop(cfg)) {
      lines.push(...this.generateLoop(cfg));
    }
    else {
      // Complex control flow - generate block-based code
      lines.push('// Complex control flow - blocks:');
      cfg.blocks.forEach(block => {
        lines.push(`Block${block.id}:`);
        block.instructions.forEach(instr => {
          lines.push(`    // ${instr.opcode}`);
        });
      });
    }

    return lines.join('\n');
  }

  private isSimpleReturn(cfg: ControlFlowGraph): boolean {
    return cfg.blocks.length === 1 && 
           cfg.blocks[0].instructions.some(i => i.opcode === 'ret');
  }

  private extractReturnValue(instructions: ILInstruction[]): string {
    // Find what's loaded before return
    const retIndex = instructions.findIndex(i => i.opcode === 'ret');
    if (retIndex > 0) {
      const prevInstr = instructions[retIndex - 1];
      
      if (prevInstr.opcode === 'ldnull') return 'null';
      if (prevInstr.opcode === 'ldc.i4.0') return '0';
      if (prevInstr.opcode === 'ldc.i4.1') return '1';
      if (prevInstr.opcode === 'ldstr' && prevInstr.operand) {
        return `"${prevInstr.operand}"`;
      }
      if (prevInstr.opcode.startsWith('ldloc')) {
        const match = prevInstr.opcode.match(/\.(\d+)$/);
        if (match) return `local${match[1]}`;
      }
    }
    
    return '/* unknown */';
  }

  private isSimpleIfElse(cfg: ControlFlowGraph): boolean {
    return cfg.blocks.length === 3 && 
           cfg.blocks[0].successors.length === 2;
  }

  private generateIfElse(cfg: ControlFlowGraph): string[] {
    const lines: string[] = [];
    
    const condition = this.extractCondition(cfg.blocks[0].instructions);
    lines.push(`if (${condition})`);
    lines.push('{');
    
    // True branch
    cfg.blocks[1].instructions.forEach(instr => {
      lines.push(`    // ${instr.opcode}`);
    });
    
    lines.push('}');
    lines.push('else');
    lines.push('{');
    
    // False branch
    cfg.blocks[2].instructions.forEach(instr => {
      lines.push(`    // ${instr.opcode}`);
    });
    
    lines.push('}');
    
    return lines;
  }

  private extractCondition(instructions: ILInstruction[]): string {
    // Simplified condition extraction
    const branchInstr = instructions.find(i => this.isConditionalBranch(i.opcode));
    if (branchInstr) {
      if (branchInstr.opcode.startsWith('brtrue')) return 'condition';
      if (branchInstr.opcode.startsWith('brfalse')) return '!condition';
      if (branchInstr.opcode.startsWith('beq')) return 'a == b';
      if (branchInstr.opcode.startsWith('bne')) return 'a != b';
      if (branchInstr.opcode.startsWith('blt')) return 'a < b';
      if (branchInstr.opcode.startsWith('bge')) return 'a >= b';
    }
    return 'condition';
  }

  private isLoop(cfg: ControlFlowGraph): boolean {
    // Detect back-edge (successor with lower index)
    for (const block of cfg.blocks) {
      for (const succ of block.successors) {
        if (succ <= block.id) return true;
      }
    }
    return false;
  }

  private generateLoop(cfg: ControlFlowGraph): string[] {
    const lines: string[] = [];
    
    lines.push('while (condition)');
    lines.push('{');
    
    // Loop body
    cfg.blocks.forEach(block => {
      block.instructions.forEach(instr => {
        if (instr.opcode !== 'br' && !this.isConditionalBranch(instr.opcode)) {
          lines.push(`    // ${instr.opcode}`);
        }
      });
    });
    
    lines.push('}');
    
    return lines;
  }

  private generateStub(method: Method): string {
    return `${method.signature}\n{\n    throw new NotImplementedException();\n}`;
  }
}

export interface DecompiledMethod {
  csharp: string;
  cfg: ControlFlowGraph | null;
  variables: Variable[];
  complexity: number;
}

interface Variable {
  index: number;
  name: string;
  type: string;
  usages: number[];
}