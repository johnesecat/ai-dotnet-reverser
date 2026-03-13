// src/utils/binary-reader.ts

export class BinaryReader {
  private data: Uint8Array;
  private position: number;
  private littleEndian: boolean;

  constructor(data: Uint8Array, position: number = 0, littleEndian: boolean = true) {
    this.data = data;
    this.position = position;
    this.littleEndian = littleEndian;
  }

  getPosition(): number {
    return this.position;
  }

  setPosition(position: number): void {
    this.position = position;
  }

  canRead(bytes: number): boolean {
    return this.position + bytes <= this.data.length;
  }

  readByte(): number {
    if (!this.canRead(1)) throw new Error(`Cannot read byte at position ${this.position}`);
    return this.data[this.position++];
  }

  readSByte(): number {
    const value = this.readByte();
    return value > 127 ? value - 256 : value;
  }

  readUInt16(): number {
    if (!this.canRead(2)) throw new Error(`Cannot read UInt16 at position ${this.position}`);
    const value = this.littleEndian
      ? this.data[this.position] | (this.data[this.position + 1] << 8)
      : (this.data[this.position] << 8) | this.data[this.position + 1];
    this.position += 2;
    return value;
  }

  readInt16(): number {
    const value = this.readUInt16();
    return value > 32767 ? value - 65536 : value;
  }

  readUInt32(): number {
    if (!this.canRead(4)) throw new Error(`Cannot read UInt32 at position ${this.position}`);
    const value = this.littleEndian
      ? this.data[this.position] |
        (this.data[this.position + 1] << 8) |
        (this.data[this.position + 2] << 16) |
        (this.data[this.position + 3] << 24)
      : (this.data[this.position] << 24) |
        (this.data[this.position + 1] << 16) |
        (this.data[this.position + 2] << 8) |
        this.data[this.position + 3];
    this.position += 4;
    return value >>> 0;
  }

  readInt32(): number {
    return this.readUInt32() | 0;
  }

  readBytes(count: number): Uint8Array {
    if (!this.canRead(count)) throw new Error(`Cannot read ${count} bytes at position ${this.position}`);
    const bytes = this.data.slice(this.position, this.position + count);
    this.position += count;
    return bytes;
  }

  readCString(): string {
    const start = this.position;
    while (this.position < this.data.length && this.data[this.position] !== 0) {
      this.position++;
    }
    const bytes = this.data.slice(start, this.position);
    this.position++;
    return new TextDecoder('ascii').decode(bytes);
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder('utf-8').decode(bytes);
  }

  readCompressedUInt(): number {
    const firstByte = this.readByte();
    if ((firstByte & 0x80) === 0) return firstByte;
    if ((firstByte & 0xC0) === 0x80) {
      const secondByte = this.readByte();
      return ((firstByte & 0x3F) << 8) | secondByte;
    }
    if ((firstByte & 0xE0) === 0xC0) {
      const b2 = this.readByte();
      const b3 = this.readByte();
      const b4 = this.readByte();
      return ((firstByte & 0x1F) << 24) | (b2 << 16) | (b3 << 8) | b4;
    }
    throw new Error('Invalid compressed integer');
  }

  skip(count: number): void {
    if (!this.canRead(count)) throw new Error(`Cannot skip ${count} bytes at position ${this.position}`);
    this.position += count;
  }

  align(alignment: number): void {
    const remainder = this.position % alignment;
    if (remainder !== 0) this.skip(alignment - remainder);
  }

  getRemainingBytes(): number {
    return this.data.length - this.position;
  }
}
