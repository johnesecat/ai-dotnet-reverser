// src/exporters/project-generator.ts

import type { Assembly, Type } from '../types/assembly';

export class ProjectGenerator {
  generateCsProj(assembly: Assembly, projectType: ProjectType): string {
    const lines: string[] = [];
    
    lines.push('<Project Sdk="Microsoft.NET.Sdk">');
    lines.push('');
    lines.push('  <PropertyGroup>');
    lines.push(`    <OutputType>${this.getOutputType(projectType)}</OutputType>`);
    lines.push('    <TargetFramework>net8.0</TargetFramework>');
    lines.push('    <LangVersion>latest</LangVersion>');
    lines.push('    <Nullable>enable</Nullable>');
    lines.push(`    <AssemblyName>${assembly.name}</AssemblyName>`);
    lines.push(`    <RootNamespace>${this.getRootNamespace(assembly)}</RootNamespace>`);
    
    if (projectType === 'WPF') {
      lines.push('    <UseWPF>true</UseWPF>');
    } else if (projectType === 'WinForms') {
      lines.push('    <UseWindowsForms>true</UseWindowsForms>');
    }
    
    lines.push('  </PropertyGroup>');
    lines.push('');
    
    // References (if any)
    const refs = this.getReferences(assembly);
    if (refs.length > 0) {
      lines.push('  <ItemGroup>');
      refs.forEach(ref => {
        lines.push(`    <PackageReference Include="${ref.name}" Version="${ref.version}" />`);
      });
      lines.push('  </ItemGroup>');
      lines.push('');
    }
    
    lines.push('</Project>');
    
    return lines.join('\n');
  }

  private getOutputType(projectType: ProjectType): string {
    switch (projectType) {
      case 'Console': return 'Exe';
      case 'WPF': return 'WinExe';
      case 'WinForms': return 'WinExe';
      case 'Library': return 'Library';
      default: return 'Exe';
    }
  }

  private getRootNamespace(assembly: Assembly): string {
    // Get most common namespace
    const namespaces = assembly.types
      .map(t => t.namespace)
      .filter(ns => ns && ns !== '');
    
    if (namespaces.length === 0) return assembly.name;
    
    // Find most common
    const counts: { [key: string]: number } = {};
    namespaces.forEach(ns => {
      counts[ns] = (counts[ns] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  private getReferences(assembly: Assembly): PackageReference[] {
    // Simplified - would parse AssemblyRef table
    return [];
  }

  detectProjectType(assembly: Assembly): ProjectType {
    const typeNames = assembly.types.map(t => t.fullName.toLowerCase());
    
    // Check for WPF
    if (typeNames.some(n => n.includes('window') || n.includes('.xaml'))) {
      return 'WPF';
    }
    
    // Check for WinForms
    if (typeNames.some(n => n.includes('form') || n.includes('system.windows.forms'))) {
      return 'WinForms';
    }
    
    // Check for ASP.NET
    if (typeNames.some(n => n.includes('controller') || n.includes('startup'))) {
      return 'ASP.NET';
    }
    
    // Check for entry point (console)
    const hasMain = assembly.methods.some(m => 
      m.name === 'Main' && m.signature.includes('static')
    );
    
    return hasMain ? 'Console' : 'Library';
  }
}

export type ProjectType = 'Console' | 'WPF' | 'WinForms' | 'Library' | 'ASP.NET';

interface PackageReference {
  name: string;
  version: string;
}
