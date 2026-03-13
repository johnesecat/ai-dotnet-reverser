// src/config/paths.ts

class PathManager {
  private basePath: string;

  constructor() {
    this.basePath = import.meta.env.BASE_URL || '/';
  }

  getPath(relativePath: string): string {
    const cleanPath = relativePath.startsWith('/') 
      ? relativePath.slice(1) 
      : relativePath;
    return this.basePath + cleanPath;
  }

  getBaseURL(): string {
    return window.location.origin + this.basePath;
  }
}

export const pathManager = new PathManager();
export const getPath = (path: string) => pathManager.getPath(path);
export const getBaseURL = () => pathManager.getBaseURL();
