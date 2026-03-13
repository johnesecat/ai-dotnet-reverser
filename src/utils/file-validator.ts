// src/utils/file-validator.ts

export interface ValidationResult {
  isValid: boolean;
  format?: string;
  errors: string[];
  warnings: string[];
  metadata?: {
    isDotNet: boolean;
    fileSize: number;
  };
}

export async function validateFile(file: File): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check file extension
  const ext = file.name.toLowerCase();
  if (!ext.endsWith('.dll') && !ext.endsWith('.exe')) {
    result.errors.push('File must be .dll or .exe');
    result.isValid = false;
  }

  // Check file size
  if (file.size > 500 * 1024 * 1024) {
    result.errors.push('File too large (max 500MB)');
    result.isValid = false;
  }

  if (file.size > 100 * 1024 * 1024) {
    result.warnings.push('Large file may be slow to parse');
  }

  // Read file header
  try {
    const headerBuffer = await file.slice(0, 512).arrayBuffer();
    const header = new Uint8Array(headerBuffer);

    // Check PE signature (MZ)
    if (header[0] !== 0x4D || header[1] !== 0x5A) {
      result.errors.push('Not a valid PE file (missing MZ signature)');
      result.isValid = false;
    } else {
      result.format = 'PE32';

      // Check for .NET metadata
      const peOffset = header[0x3C] | (header[0x3D] << 8);
      if (peOffset < headerBuffer.byteLength - 4) {
        const peSig = String.fromCharCode(header[peOffset], header[peOffset + 1]);
        if (peSig === 'PE') {
          result.metadata = {
            isDotNet: true, // Will be confirmed by full parse
            fileSize: file.size
          };
        }
      }
    }
  } catch (error) {
    result.errors.push('Failed to read file header');
    result.isValid = false;
  }

  return result;
}
