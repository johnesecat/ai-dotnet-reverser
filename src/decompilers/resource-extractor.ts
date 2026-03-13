// src/decompilers/resource-extractor.ts

import type { Resource } from '../parsers/metadata-reader';

export class ResourceExtractor {
  extractAll(resources: Resource[]): ExtractedResource[] {
    const extracted: ExtractedResource[] = [];

    for (const resource of resources) {
      extracted.push({
        name: resource.name,
        type: resource.type,
        size: resource.size,
        content: this.getContent(resource),
        path: this.getPath(resource.name)
      });
    }

    return extracted;
  }

  private getContent(resource: Resource): string | Uint8Array {
    if (resource.type === 'BAML' || resource.type === 'XAML') {
      // Return as string
      return resource.data 
        ? new TextDecoder().decode(resource.data)
        : '';
    }
    
    // Return binary data
    return resource.data || new Uint8Array();
  }

  private getPath(name: string): string {
    // Convert resource name to file path
    // Example: MyApp.Resources.Icon.png -> Resources/Icon.png
    const parts = name.split('.');
    const fileName = parts[parts.length - 1];
    const folder = parts.slice(0, -1).join('/');
    return `${folder}/${fileName}`;
  }
}

export interface ExtractedResource {
  name: string;
  type: string;
  size: number;
  content: string | Uint8Array;
  path: string;
}
