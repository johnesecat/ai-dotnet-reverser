// src/store/assembly-store.ts

import { create } from 'zustand';
import type { Assembly, Type, Method, ObfuscationInfo } from '../types/assembly';

interface AssemblyStore {
  assembly: Assembly | null;
  selectedType: Type | null;
  selectedMethod: Method | null;
  obfuscationInfo: ObfuscationInfo | null;
  isAnalyzing: boolean;
  
  setAssembly: (assembly: Assembly) => void;
  setSelectedType: (type: Type | null) => void;
  setSelectedMethod: (method: Method | null) => void;
  setObfuscationInfo: (info: ObfuscationInfo | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  reset: () => void;
}

export const useAssemblyStore = create<AssemblyStore>((set) => ({
  assembly: null,
  selectedType: null,
  selectedMethod: null,
  obfuscationInfo: null,
  isAnalyzing: false,

  setAssembly: (assembly) => set({ assembly }),
  setSelectedType: (selectedType) => set({ selectedType }),
  setSelectedMethod: (selectedMethod) => set({ selectedMethod }),
  setObfuscationInfo: (obfuscationInfo) => set({ obfuscationInfo }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () => set({
    assembly: null,
    selectedType: null,
    selectedMethod: null,
    obfuscationInfo: null,
    isAnalyzing: false
  })
}));
