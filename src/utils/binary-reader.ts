export class BinaryReader {
  private data: Uint8Array;
  private position: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  readUInt8(): number {
    if (this.position >= this.data.length) throw new Error('EOF');
    return this.data[this.position++];
  }

  readUInt16(): number {
    if (this.position + 1 >= this.data.length) throw new Error('EOF');
    const value = this.data[this.position] | (this.data[this.position + 1] << 8);
    this.position += 2;
    return value;
  }

  readUInt32(): number {
    if (this.position + 3 >= this.data.length) throw new Error('EOF');
    const value = (
      this.data[this.position] |
      (this.data[this.position + 1] << 8) |
      (this.data[this.position + 2] << 16) |
      (this.data[this.position + 3] << 24)
    ) >>> 0;
    this.position += 4;
    return value;
  }

  readBytes(count: number): Uint8Array {
    if (this.position + count > this.data.length) throw new Error('EOF');
    const bytes = this.data.slice(this.position, this.position + count);
    this.position += count;
    return bytes;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\0/g, '');
  }

  seek(position: number): void {
    if (position < 0 || position > this.data.length) throw new Error('Invalid position');
    this.position = position;
  }

  getPosition(): number {
    return this.position;
  }

  remaining(): number {
    return this.data.length - this.position;
  }
}
