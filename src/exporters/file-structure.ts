// src/exporters/file-structure.ts

import type { Assembly, Type } from '../types/assembly';
import { ILToCSharpDecompiler } from '../decompilers/il-to-csharp';
import type { ProjectType } from './project-generator';

export class FileStructureBuilder {
  private decompiler = new ILToCSharpDecompiler();

  build(assembly: Assembly, projectType: ProjectType): FileStructure {
    const structure: FileStructure = {
      projectName: assembly.name,
      files: []
    };

    // Generate source files
    assembly.types.forEach(type => {
      const filePath = this.getFilePath(type, projectType);
      const content = this.decompiler.decompileType(type);
      
      structure.files.push({
        path: filePath,
        content,
        type: 'csharp'
      });
    });

    // Add Program.cs for console apps
    if (projectType === 'Console') {
      structure.files.push({
        path: 'Program.cs',
        content: this.generateProgramCs(assembly),
        type: 'csharp'
      });
    }

    // Add App.xaml for WPF
    if (projectType === 'WPF') {
      structure.files.push({
        path: 'App.xaml',
        content: this.generateAppXaml(assembly),
        type: 'xaml'
      });
      structure.files.push({
        path: 'App.xaml.cs',
        content: this.generateAppXamlCs(assembly),
        type: 'csharp'
      });
    }

    return structure;
  }

  private getFilePath(type: Type, projectType: ProjectType): string {
    const fileName = `${type.name}.cs`;
    
    if (!type.namespace || type.namespace === '') {
      return fileName;
    }
    
    // Convert namespace to folder structure
    const folders = type.namespace.split('.');
    return `${folders.join('/')}/${fileName}`;
  }

  private generateProgramCs(assembly: Assembly): string {
    const namespace = assembly.types[0]?.namespace || assembly.name;
    
    return `namespace ${namespace}
{
    class Program
    {
        static void Main(string[] args)
        {
            // Decompiled from ${assembly.name}
            Console.WriteLine("Hello from decompiled assembly!");
        }
    }
}`;
  }

  private generateAppXaml(assembly: Assembly): string {
    return `<Application x:Class="${assembly.name}.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="MainWindow.xaml">
    <Application.Resources>
         
    </Application.Resources>
</Application>`;
  }

  private generateAppXamlCs(assembly: Assembly): string {
    return `using System.Windows;

namespace ${assembly.name}
{
    public partial class App : Application
    {
    }
}`;
  }
}

export interface FileStructure {
  projectName: string;
  files: ProjectFile[];
}

export interface ProjectFile {
  path: string;
  content: string;
  type: 'csharp' | 'xaml' | 'xml' | 'json';
}
