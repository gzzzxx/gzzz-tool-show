/**
 * 纯前端 SM4 / AES 加解密
 *
 * 历史：原本走 /sm4/encrypt、/sm4/decrypt 后端（BouncyCastle）；
 * 现迁移到纯前端，行为对齐后端 Sm4Util：
 *   - 加密输入：TEXT=Utf8、HEX=Hex、BASE64=Base64
 *   - 解密输入：TEXT=当作 Base64（与 Sm4Util#handleData 一致）、HEX/BASE64 同义
 *   - 密钥：TEXT/BASE64/HEX（UI 仅暴露 BASE64/HEX）
 *   - 结果：内部以字节数组流转，最后按 resultType 格式化；
 *     加密时 resultType=TEXT 与 BASE64 等价（对齐原 UI label「文本（加密为Base64）」）
 */

import CryptoJS from 'crypto-js'
import { sm4 } from 'sm-crypto'

export type DataType = 'TEXT' | 'BASE64' | 'HEX'
export type Mode = 'ECB' | 'CBC' | 'CTR'
export type Algorithm = 'SM4' | 'AES'

export interface CipherParams {
  algorithmName: Algorithm
  data: string
  key: string
  iv: string
  mode: Mode
  dataType: DataType
  resultType: DataType
  keyType: DataType
}

const BLOCK_SIZE = 16

/* ============================
 * 字符串 ↔ Uint8Array 互转
 * ============================ */

function bytesToHex(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i++) {
    const h = b[i].toString(16)
    s += h.length === 1 ? '0' + h : h
  }
  return s
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/\s+/g, '').toLowerCase()
  if (clean.length % 2 !== 0) throw new Error('hex 长度必须为偶数')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(clean.substr(i * 2, 2), 16)
    if (Number.isNaN(byte)) throw new Error(`非法 hex：${clean.substr(i * 2, 2)}`)
    out[i] = byte
  }
  return out
}

function bytesToB64(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i])
  return btoa(s)
}

function b64ToBytes(s: string): Uint8Array {
  const cleaned = s.trim().replace(/\s+/g, '')
  const bin = atob(cleaned)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function parseInput(value: string, type: DataType, label: string): Uint8Array {
  if (!value) throw new Error(`请输入${label}！`)
  try {
    if (type === 'TEXT') return new TextEncoder().encode(value)
    if (type === 'BASE64') return b64ToBytes(value)
    return hexToBytes(value)
  } catch (e: any) {
    throw new Error(`${label}格式不正确：${e?.message ?? e}`)
  }
}

function formatOutput(b: Uint8Array, type: DataType): string {
  if (type === 'TEXT') return new TextDecoder('utf-8', { fatal: false }).decode(b)
  if (type === 'BASE64') return bytesToB64(b)
  return bytesToHex(b)
}

function bytesToWordArray(b: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = []
  for (let i = 0; i < b.length; i++) words[i >>> 2] |= b[i] << (24 - (i % 4) * 8)
  return CryptoJS.lib.WordArray.create(words, b.length)
}

function wordArrayToBytes(wa: CryptoJS.lib.WordArray): Uint8Array {
  const { words, sigBytes } = wa
  const out = new Uint8Array(sigBytes)
  for (let i = 0; i < sigBytes; i++) out[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  return out
}

/* ============================
 * PKCS#7 填充
 * ============================ */

function pkcs7Pad(data: Uint8Array): Uint8Array {
  const pad = BLOCK_SIZE - (data.length % BLOCK_SIZE)
  const out = new Uint8Array(data.length + pad)
  out.set(data)
  for (let i = data.length; i < out.length; i++) out[i] = pad
  return out
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  if (!data.length || data.length % BLOCK_SIZE !== 0) throw new Error('密文长度不是 block 的整数倍')
  const pad = data[data.length - 1]
  if (pad < 1 || pad > BLOCK_SIZE) throw new Error('PKCS#7 padding 非法')
  for (let i = data.length - pad; i < data.length; i++) {
    if (data[i] !== pad) throw new Error('PKCS#7 padding 非法')
  }
  return data.subarray(0, data.length - pad)
}

/* ============================
 * 入参解析（key / iv / data 共用）
 * ============================ */

interface ParsedInputs {
  keyBytes: Uint8Array
  keyHex: string
  ivHex: string
  ivBytes: Uint8Array | null
  dataBytes: Uint8Array
}

function parseInputs(p: CipherParams, op: 'enc' | 'dec'): ParsedInputs {
  const keyBytes = parseInput(p.key, p.keyType, '密钥')
  if (keyBytes.length !== BLOCK_SIZE) throw new Error('密钥长度必须为 128 位（16 字节）')

  let ivBytes: Uint8Array | null = null
  if (p.mode === 'CBC' || p.mode === 'CTR') {
    if (!p.iv) throw new Error(`${p.mode} 模式向量不能为空！`)
    ivBytes = parseInput(p.iv, p.keyType, '向量')
    if (ivBytes.length !== BLOCK_SIZE) throw new Error('向量长度必须为 128 位（16 字节）')
  }

  // 对齐后端：解密时 dataType=TEXT 按 BASE64 解读（与 Sm4Util#handleData 一致）
  const dataType = op === 'dec' && p.dataType === 'TEXT' ? 'BASE64' : p.dataType
  const dataBytes = parseInput(p.data, dataType, op === 'enc' ? '加密内容' : '解密内容')

  return {
    keyBytes,
    keyHex: bytesToHex(keyBytes),
    ivBytes,
    ivHex: ivBytes ? bytesToHex(ivBytes) : '',
    dataBytes,
  }
}

/* ============================
 * SM4：sm-crypto 提供 ECB / CBC；CTR 用 ECB 自实现
 * ============================ */

/**
 * SM4 单块加/解密（ECB/CBC 共用）。注意 sm-crypto 的怪癖：
 *   - 字符串入参会被当 utf8 解读（不通用）→ 必须传字节数组才能与
 *     BouncyCastle 等标准实现对齐
 *   - encrypt 默认返回 hex 字符串 → 需 hexToBytes
 *   - decrypt(output:'array') 直接返回字节数组
 */
function sm4Block(keyHex: string, ivHex: string, input: Uint8Array, op: 'enc' | 'dec', mode: 'ECB' | 'CBC'): Uint8Array {
  const opts: any = mode === 'CBC' ? { mode: 'cbc', iv: ivHex } : {}
  const bytes = Array.from(input)
  if (op === 'enc') return hexToBytes(sm4.encrypt(bytes, keyHex, { ...opts, padding: 'none' }))
  return new Uint8Array(sm4.decrypt(bytes, keyHex, { ...opts, padding: 'none', output: 'array' }))
}

/** SM4 CTR：counter 初值 = IV，每块末字节 +1（与 crypto-js mode-ctr 行为对齐） */
function sm4Ctr(keyHex: string, ivBytes: Uint8Array, input: Uint8Array): Uint8Array {
  const counter = new Uint8Array(ivBytes)
  const out = new Uint8Array(input.length)
  for (let off = 0; off < input.length; off += BLOCK_SIZE) {
    const ks = sm4Block(keyHex, '', counter, 'enc', 'ECB')
    const chunk = Math.min(BLOCK_SIZE, input.length - off)
    for (let i = 0; i < chunk; i++) out[off + i] = input[off + i] ^ ks[i]
    counter[BLOCK_SIZE - 1] = (counter[BLOCK_SIZE - 1] + 1) & 0xff
  }
  return out
}

function sm4Operate(op: 'enc' | 'dec', p: CipherParams): Uint8Array {
  const { keyHex, ivBytes, ivHex, dataBytes } = parseInputs(p, op)
  if (p.mode === 'CTR') {
    if (dataBytes.length % BLOCK_SIZE !== 0) throw new Error('CTR 模式数据长度必须为 16 字节的整数倍')
    return sm4Ctr(keyHex, ivBytes!, dataBytes)
  }
  const raw = sm4Block(keyHex, ivHex, op === 'enc' ? pkcs7Pad(dataBytes) : dataBytes, op, p.mode)
  return op === 'enc' ? raw : pkcs7Unpad(raw)
}

/* ============================
 * AES（crypto-js：ECB / CBC / CTR + PKCS7 / NoPadding）
 * ============================ */

function aesOperate(op: 'enc' | 'dec', p: CipherParams): Uint8Array {
  const { keyBytes, ivBytes, dataBytes } = parseInputs(p, op)
  const isCtr = p.mode === 'CTR'
  if (isCtr && dataBytes.length % BLOCK_SIZE !== 0) {
    throw new Error('CTR 模式数据长度必须为 16 字节的整数倍')
  }

  const opts: CryptoJS.CipherOption = {
    mode: isCtr ? CryptoJS.mode.CTR
      : p.mode === 'CBC' ? CryptoJS.mode.CBC
      : CryptoJS.mode.ECB,
    padding: isCtr ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
  }
  if (ivBytes) (opts as any).iv = bytesToWordArray(ivBytes)

  const result = op === 'enc'
    ? CryptoJS.AES.encrypt(bytesToWordArray(dataBytes), bytesToWordArray(keyBytes), opts)
    : CryptoJS.AES.decrypt({ ciphertext: bytesToWordArray(dataBytes) } as any, bytesToWordArray(keyBytes), opts)

  // crypto-js 的 AES.encrypt 返回 CipherParams；解密返回 WordArray。统一取 ciphertext
  const ct: CryptoJS.lib.WordArray = (result as any).ciphertext ?? result
  return wordArrayToBytes(ct)
}

/* ============================
 * 对外入口
 * ============================ */

function runCipher(op: 'enc' | 'dec', p: CipherParams): string {
  const raw = p.algorithmName === 'SM4' ? sm4Operate(op, p)
    : p.algorithmName === 'AES' ? aesOperate(op, p)
    : (() => { throw new Error(`不支持的算法：${p.algorithmName}`) })()
  // 加密时 resultType=TEXT 在原 UI label 是「文本（加密为Base64）」，
  // 与 BASE64 等价；解密时 TEXT 才是字面 UTF-8 明文
  const resultType = op === 'enc' && p.resultType === 'TEXT' ? 'BASE64' : p.resultType
  return formatOutput(raw, resultType)
}

export function sm4Encrypt(p: CipherParams): string { return runCipher('enc', { ...p, algorithmName: 'SM4' }) }
export function sm4Decrypt(p: CipherParams): string { return runCipher('dec', { ...p, algorithmName: 'SM4' }) }
export function aesEncrypt(p: CipherParams): string { return runCipher('enc', { ...p, algorithmName: 'AES' }) }
export function aesDecrypt(p: CipherParams): string { return runCipher('dec', { ...p, algorithmName: 'AES' }) }