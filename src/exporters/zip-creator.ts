// src/exporters/zip-creator.ts

import type { FileStructure } from './file-structure';

/**
 * Creates a downloadable ZIP file using JSZip
 * Note: Add jszip to package.json dependencies
 */

export class ZipCreator {
  async create(
    fileStructure: FileStructure,
    csProj: string,
    sln: string
  ): Promise<Blob> {
    // Dynamic import to keep bundle size small
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const projectFolder = zip.folder(fileStructure.projectName);
    if (!projectFolder) {
      throw new Error('Failed to create project folder');
    }

    // Add solution file
    zip.file(`${fileStructure.projectName}.sln`, sln);

    // Add project file
    projectFolder.file(`${fileStructure.projectName}.csproj`, csProj);

    // Add all source files
    fileStructure.files.forEach(file => {
      projectFolder.file(file.path, file.content);
    });

    // Generate ZIP
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  downloadZip(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
