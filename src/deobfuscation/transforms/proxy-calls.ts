// src/deobfuscation/transforms/proxy-calls.ts

import type { Assembly, Method } from '../../types/assembly';
import type { TransformResult } from './string-decrypt';

/**
 * Proxy call removal transform
 * Removes indirection layers added by obfuscators
 */

export class ProxyCallTransform {
  async apply(assembly: Assembly): Promise<TransformResult> {
    const result: TransformResult = {
      success: true,
      itemsProcessed: 0,
      itemsModified: 0,
      errors: []
    };

    try {
      // Find proxy methods
      const proxyMethods = this.findProxyMethods(assembly);
      result.itemsProcessed = proxyMethods.length;

      if (proxyMethods.length === 0) {
        return result;
      }

      // Build call graph
      const callGraph = this.buildCallGraph(assembly);

      // Remove proxy calls
      for (const proxy of proxyMethods) {
        const removed = this.removeProxyCalls(proxy, callGraph, assembly);
        if (removed > 0) {
          result.itemsModified += removed;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private findProxyMethods(assembly: Assembly): Method[] {
    return assembly.methods.filter(method => {
      if (!method.instructions || method.instructions.length === 0) return false;

      // Proxy methods are typically very short (1-3 instructions)
      if (method.instructions.length > 5) return false;

      // Should contain only a call and return
      const hasCall = method.instructions.some(i => 
        i.opcode === 'call' || i.opcode === 'callvirt'
      );
      const hasReturn = method.instructions.some(i => i.opcode === 'ret');

      if (!hasCall || !hasReturn) return false;

      // Should have low complexity
      if (method.cyclomaticComplexity > 1) return false;

      return true;
    });
  }

  private buildCallGraph(assembly: Assembly): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const method of assembly.methods) {
      if (!method.instructions) continue;

      const calls: string[] = [];

      for (const instr of method.instructions) {
        if (instr.opcode === 'call' || instr.opcode === 'callvirt') {
          // Extract called method (simplified - operand would be a token)
          if (instr.operand) {
            calls.push(String(instr.operand));
          }
        }
      }

      if (calls.length > 0) {
        graph.set(method.id, calls);
      }
    }

    return graph;
  }

  private removeProxyCalls(
    proxy: Method,
    callGraph: Map<string, string[]>,
    assembly: Assembly
  ): number {
    let removedCount = 0;

    // Find what the proxy calls
    const proxyCalls = callGraph.get(proxy.id);
    if (!proxyCalls || proxyCalls.length !== 1) return 0;

    const targetMethod = proxyCalls[0];

    // Find all methods that call this proxy
    for (const [methodId, calls] of callGraph.entries()) {
      if (calls.includes(proxy.id)) {
        // Replace proxy call with direct call
        const method = assembly.methods.find(m => m.id === methodId);
        if (method && method.ilCode) {
          // Simple text replacement (in real implementation, would modify IL)
          method.ilCode = method.ilCode.replace(
            `call ${proxy.name}`,
            `call ${targetMethod} // Deproxied`
          );
          removedCount++;
        }
      }
    }

    return removedCount;
  }
}
