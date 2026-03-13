// src/exporters/solution-generator.ts

export class SolutionGenerator {
  generate(projectName: string, projectGuid: string): string {
    const lines: string[] = [];
    
    lines.push('');
    lines.push('Microsoft Visual Studio Solution File, Format Version 12.00');
    lines.push('# Visual Studio Version 17');
    lines.push('VisualStudioVersion = 17.0.31903.59');
    lines.push('MinimumVisualStudioVersion = 10.0.40219.1');
    
    lines.push(`Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "${projectName}", "${projectName}\\${projectName}.csproj", "{${projectGuid}}"`);
    lines.push('EndProject');
    
    lines.push('Global');
    lines.push('\tGlobalSection(SolutionConfigurationPlatforms) = preSolution');
    lines.push('\t\tDebug|Any CPU = Debug|Any CPU');
    lines.push('\t\tRelease|Any CPU = Release|Any CPU');
    lines.push('\tEndGlobalSection');
    lines.push('\tGlobalSection(ProjectConfigurationPlatforms) = postSolution');
    lines.push(`\t\t{${projectGuid}}.Debug|Any CPU.ActiveCfg = Debug|Any CPU`);
    lines.push(`\t\t{${projectGuid}}.Debug|Any CPU.Build.0 = Debug|Any CPU`);
    lines.push(`\t\t{${projectGuid}}.Release|Any CPU.ActiveCfg = Release|Any CPU`);
    lines.push(`\t\t{${projectGuid}}.Release|Any CPU.Build.0 = Release|Any CPU`);
    lines.push('\tEndGlobalSection');
    lines.push('EndGlobal');
    
    return lines.join('\n');
  }

  generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }
}
