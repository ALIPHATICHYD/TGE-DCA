export function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function uint8ArrayToHex(arr: Uint8Array): string {
  return '0x' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// Parse an EncryptedObject using the SDK if available. Falls back to returning null.
export async function parseEncryptedObject(encryptedBytes: Uint8Array | string): Promise<any | null> {
  try {
    // @ts-ignore
    const Seal = await import('@mysten/seal');
    const EncryptedObject = Seal.EncryptedObject;
    const bytes = typeof encryptedBytes === 'string' ? hexToUint8Array(encryptedBytes) : encryptedBytes;
    return EncryptedObject.parse(bytes);
  } catch (e) {
    // SDK not installed or parse failed
    console.warn('parseEncryptedObject: Seal SDK not available or parse failed', e);
    return null;
  }
}
