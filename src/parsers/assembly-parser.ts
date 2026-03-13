// src/parsers/assembly-parser.ts

import { PEParser } from './pe-parser';
import { MetadataReader } from './metadata-reader';
import { calculateSHA256 } from '../utils/crypto';
import type { Assembly, Method } from '../types/assembly';

export async function parseAssembly(file: File): Promise<Assembly> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const peParser = new PEParser(data);
  const peInfo = peParser.parse();

  if (!peInfo.isValid) {
    throw new Error(peInfo.error || 'Invalid PE file');
  }

  const metadataBytes = peParser.getMetadataBytes(peInfo);
  if (!metadataBytes) {
    throw new Error('Could not read metadata');
  }

  const metadataReader = new MetadataReader(metadataBytes);
  const { types, name, version } = metadataReader.read();

  const methods: Method[] = types.flatMap(t => t.methods);

  const hash = await calculateSHA256(data);

  return {
    name,
    version,
    types,
    methods,
    hash,
    fileSize: file.size
  };
}
