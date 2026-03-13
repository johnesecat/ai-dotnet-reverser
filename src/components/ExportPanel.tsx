// src/components/ExportPanel.tsx

import React, { useState } from 'react';
import { Download, FolderOpen, FileCode, Loader } from 'lucide-react';
import { useAssemblyStore } from '../store/assembly-store';
import { ProjectGenerator } from '../exporters/project-generator';
import { SolutionGenerator } from '../exporters/solution-generator';
import { FileStructureBuilder } from '../exporters/file-structure';
import { ZipCreator } from '../exporters/zip-creator';

export function ExportPanel() {
  const { assembly } = useAssemblyStore();
  const [isExporting, setIsExporting] = useState(false);
  const [projectType, setProjectType] = useState<'Console' | 'WPF' | 'WinForms' | 'Library'>('Console');

  const handleExport = async () => {
    if (!assembly) return;

    setIsExporting(true);

    try {
      // Generate project
      const projectGen = new ProjectGenerator();
      const detectedType = projectGen.detectProjectType(assembly);
      const csProj = projectGen.generateCsProj(assembly, projectType || detectedType);

      // Generate solution
      const solutionGen = new SolutionGenerator();
      const projectGuid = solutionGen.generateGuid();
      const sln = solutionGen.generate(assembly.name, projectGuid);

      // Generate file structure
      const fileBuilder = new FileStructureBuilder();
      const fileStructure = fileBuilder.build(assembly, projectType || detectedType);

      // Create ZIP
      const zipCreator = new ZipCreator();
      const blob = await zipCreator.create(fileStructure, csProj, sln);

      // Download
      zipCreator.downloadZip(blob, `${assembly.name}.zip`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!assembly) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <FolderOpen className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export to Visual Studio
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project Type
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="Console">Console Application</option>
            <option value="WPF">WPF Application</option>
            <option value="WinForms">WinForms Application</option>
            <option value="Library">Class Library</option>
          </select>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Export Contents:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Solution file (.sln)
            </li>
            <li className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Project file (.csproj)
            </li>
            <li className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              {assembly.types.length} source files (.cs)
            </li>
            <li className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Organized folder structure
            </li>
          </ul>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Visual Studio Project
            </>
          )}
        </button>
      </div>
    </div>
  );
}
