/*
  md5.ts — MD5 message digest (RFC 1321), pure TypeScript.

  Why ship our own: Web Crypto (`crypto.subtle.digest`) intentionally
  omits MD5. MD5 is still useful for non-security purposes — file
  fingerprints, cache keys, ETag-like content ids, legacy integration.

  ⚠️ MD5 is cryptographically broken (collision attacks are practical).
  Do not use for any security purpose (TLS, passwords, signatures).

  Standard textbook implementation by Ron Rivest (1992), modernized
  to typed arrays + explicit little-endian handling.
*/

// Per-round left-rotate amounts (RFC 1321 §3.4 step 4).
const S: readonly number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

// K[i] = floor(2^32 * |sin(i+1)|)
const K: Uint32Array = (() => {
  const out = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    out[i] = Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1)))
  }
  return out
})()

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0
}

function bytesToHex(bytes: Uint8Array): string {
  const hex = new Array<string>(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    hex[i] = bytes[i].toString(16).padStart(2, '0')
  }
  return hex.join('')
}

export function md5(input: string): string {
  return md5Bytes(new TextEncoder().encode(input))
}

export function md5Bytes(bytes: Uint8Array): string {
  // Padding: append 0x80, zero-pad to ≡ 56 (mod 64), then 64-bit
  // little-endian bit length of the original message.
  const origLen = bytes.length
  const bitLen = origLen * 8
  // Need ≥ 9 extra bytes (1 for 0x80, 8 for length); round up to 64.
  const totalLen = (Math.floor((origLen + 9 - 1) / 64) + 1) * 64
  const padded = new Uint8Array(totalLen)
  padded.set(bytes)
  padded[origLen] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(totalLen - 8, bitLen >>> 0, true)
  view.setUint32(totalLen - 4, Math.floor(bitLen / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let chunk = 0; chunk < totalLen; chunk += 64) {
    const M = new Uint32Array(padded.buffer, chunk, 16)
    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number
      if (i < 16) {
        f = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        f = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        f = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      f = (f + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(f, S[i])) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  // Output: little-endian concatenation of a0‖b0‖c0‖d0
  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0,  a0, true)
  outView.setUint32(4,  b0, true)
  outView.setUint32(8,  c0, true)
  outView.setUint32(12, d0, true)
  return bytesToHex(out)
}
