// src/comparison/assembly-diff.ts

import type { Assembly, Type, Method } from '../types/assembly';

export class AssemblyDiff {
  compare(before: Assembly, after: Assembly): DiffResult {
    const result: DiffResult = {
      typesAdded: [],
      typesRemoved: [],
      typesModified: [],
      methodsAdded: 0,
      methodsRemoved: 0,
      methodsModified: 0,
      improvements: {
        namesCleared: 0,
        complexityReduced: 0,
        stringsDecrypted: 0
      }
    };

    const beforeTypes = new Map(before.types.map(t => [t.fullName, t]));
    const afterTypes = new Map(after.types.map(t => [t.fullName, t]));

    // Find added types
    for (const [name, type] of afterTypes) {
      if (!beforeTypes.has(name)) {
        result.typesAdded.push(type);
      }
    }

    // Find removed types
    for (const [name, type] of beforeTypes) {
      if (!afterTypes.has(name)) {
        result.typesRemoved.push(type);
      }
    }

    // Find modified types
    for (const [name, afterType] of afterTypes) {
      const beforeType = beforeTypes.get(name);
      if (beforeType) {
        const typeDiff = this.compareTypes(beforeType, afterType);
        if (typeDiff.hasChanges) {
          result.typesModified.push({
            type: afterType,
            changes: typeDiff
          });
          result.methodsAdded += typeDiff.methodsAdded;
          result.methodsRemoved += typeDiff.methodsRemoved;
          result.methodsModified += typeDiff.methodsModified;
        }

        // Track improvements
        if (beforeType.isObfuscated && !afterType.isObfuscated) {
          result.improvements.namesCleared++;
        }
      }
    }

    // Calculate complexity improvements
    const beforeComplexity = this.calculateAverageComplexity(before);
    const afterComplexity = this.calculateAverageComplexity(after);
    if (afterComplexity < beforeComplexity) {
      result.improvements.complexityReduced = beforeComplexity - afterComplexity;
    }

    return result;
  }

  private compareTypes(before: Type, after: Type): TypeDiff {
    const diff: TypeDiff = {
      hasChanges: false,
      methodsAdded: 0,
      methodsRemoved: 0,
      methodsModified: 0,
      fieldsAdded: 0,
      fieldsRemoved: 0
    };

    const beforeMethods = new Set(before.methods.map(m => m.name));
    const afterMethods = new Set(after.methods.map(m => m.name));

    // Count added/removed methods
    for (const method of after.methods) {
      if (!beforeMethods.has(method.name)) {
        diff.methodsAdded++;
        diff.hasChanges = true;
      }
    }

    for (const method of before.methods) {
      if (!afterMethods.has(method.name)) {
        diff.methodsRemoved++;
        diff.hasChanges = true;
      }
    }

    // Check for modified methods (same name, different signature)
    for (const afterMethod of after.methods) {
      const beforeMethod = before.methods.find(m => m.name === afterMethod.name);
      if (beforeMethod && beforeMethod.signature !== afterMethod.signature) {
        diff.methodsModified++;
        diff.hasChanges = true;
      }
    }

    // Count field changes
    const beforeFields = new Set(before.fields.map(f => f.name));
    const afterFields = new Set(after.fields.map(f => f.name));

    diff.fieldsAdded = Array.from(afterFields).filter(f => !beforeFields.has(f)).length;
    diff.fieldsRemoved = Array.from(beforeFields).filter(f => !afterFields.has(f)).length;

    if (diff.fieldsAdded > 0 || diff.fieldsRemoved > 0) {
      diff.hasChanges = true;
    }

    return diff;
  }

  private calculateAverageComplexity(assembly: Assembly): number {
    if (assembly.methods.length === 0) return 0;
    const total = assembly.methods.reduce((sum, m) => sum + m.cyclomaticComplexity, 0);
    return total / assembly.methods.length;
  }
}

export interface DiffResult {
  typesAdded: Type[];
  typesRemoved: Type[];
  typesModified: Array<{
    type: Type;
    changes: TypeDiff;
  }>;
  methodsAdded: number;
  methodsRemoved: number;
  methodsModified: number;
  improvements: {
    namesCleared: number;
    complexityReduced: number;
    stringsDecrypted: number;
  };
}

interface TypeDiff {
  hasChanges: boolean;
  methodsAdded: number;
  methodsRemoved: number;
  methodsModified: number;
  fieldsAdded: number;
  fieldsRemoved: number;
}