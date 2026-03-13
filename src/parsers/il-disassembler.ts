// src/parsers/il-disassembler.ts

import type { ILInstruction } from '../types/assembly';

const IL_OPCODES: { [key: number]: string } = {
  0x00: 'nop',
  0x02: 'ldarg.0',
  0x03: 'ldarg.1',
  0x04: 'ldarg.2',
  0x05: 'ldarg.3',
  0x06: 'ldloc.0',
  0x07: 'ldloc.1',
  0x08: 'ldloc.2',
  0x09: 'ldloc.3',
  0x0A: 'stloc.0',
  0x0B: 'stloc.1',
  0x0C: 'stloc.2',
  0x0D: 'stloc.3',
  0x14: 'ldnull',
  0x16: 'ldc.i4.0',
  0x17: 'ldc.i4.1',
  0x1F: 'ldc.i4.s',
  0x20: 'ldc.i4',
  0x25: 'dup',
  0x26: 'pop',
  0x28: 'call',
  0x2A: 'ret',
  0x2C: 'br.s',
  0x38: 'br',
  0x39: 'brfalse.s',
  0x3A: 'brtrue.s',
  0x58: 'add',
  0x59: 'sub',
  0x5A: 'mul',
  0x5B: 'div',
  0x72: 'ldstr',
  0x73: 'newobj',
  0x7E: 'ldsfld',
  0xFE: 'extended'
};

export function disassembleMethod(ilBytes: Uint8Array): { instructions: ILInstruction[]; ilCode: string } {
  const instructions: ILInstruction[] = [];
  let offset = 0;

  while (offset < ilBytes.length) {
    const opcodeByte = ilBytes[offset];
    const opcode = IL_OPCODES[opcodeByte] || 'unknown';
    
    instructions.push({
      offset,
      opcode,
      operand: null
    });

    offset++;

    // Skip operands (simplified)
    if (opcode === 'ldc.i4.s') offset += 1;
    if (opcode === 'ldc.i4') offset += 4;
    if (opcode === 'call' || opcode === 'newobj') offset += 4;
    if (opcode === 'ldstr') offset += 4;
    if (opcode === 'br.s' || opcode === 'brfalse.s' || opcode === 'brtrue.s') offset += 1;
    if (opcode === 'br') offset += 4;
  }

  const ilCode = instructions
    .map(i => `IL_${i.offset.toString(16).padStart(4, '0')}: ${i.opcode}`)
    .join('\n');

  return { instructions, ilCode };
}

export function calculateComplexity(instructions: ILInstruction[]): number {
  let complexity = 1;
  for (const instr of instructions) {
    if (instr.opcode.startsWith('br') || instr.opcode.startsWith('bne') || 
        instr.opcode.startsWith('bge') || instr.opcode.startsWith('blt')) {
      complexity++;
    }
  }
  return complexity;
}
