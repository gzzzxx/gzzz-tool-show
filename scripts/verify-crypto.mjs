// 纯前端 SM4/AES 加解密 round-trip 自洽验证（Node 版）
// 跑法：node scripts/verify-crypto.mjs
// Node 不支持 TS，这里直接用 crypto-js + sm-crypto 复刻 src/utils/crypto.ts 的核心算法，
// 跑出来的结果应该跟前端一致（两份逻辑互为验证）。

import CryptoJS from 'crypto-js'
import smCrypto from 'sm-crypto'
const { sm4 } = smCrypto

const BLOCK = 16

const utf8 = s => new Uint8Array(Buffer.from(s, 'utf8'))
const fromUtf8 = b => Buffer.from(b).toString('utf8')
const fromHex = b => Buffer.from(b).toString('hex')
const toHex = h => new Uint8Array(Buffer.from(h, 'hex'))
const fromB64 = b => Buffer.from(b).toString('base64')
const toB64 = s => new Uint8Array(Buffer.from(s, 'base64'))

function decodeInput(v, t, label) {
  if (!v) throw new Error(`请输入${label}！`)
  return t === 'TEXT' ? utf8(v) : t === 'BASE64' ? toB64(v) : toHex(v)
}
function encodeOutput(b, t) {
  return t === 'TEXT' ? fromUtf8(b) : t === 'BASE64' ? fromB64(b) : fromHex(b)
}
function pkcs7Pad(d) {
  const p = BLOCK - (d.length % BLOCK), o = new Uint8Array(d.length + p); o.set(d)
  for (let i = d.length; i < o.length; i++) o[i] = p
  return o
}
function pkcs7Unpad(d) {
  if (!d.length || d.length % BLOCK) throw new Error('密文长度不是 block 的整数倍')
  const p = d[d.length - 1]
  if (p < 1 || p > BLOCK) throw new Error('PKCS#7 padding 非法')
  for (let i = d.length - p; i < d.length; i++) if (d[i] !== p) throw new Error('PKCS#7 padding 非法')
  return d.subarray(0, d.length - p)
}

/** sm-crypto 怪癖：字符串入参被当 utf8；encrypt 默认返 hex；decrypt(output:'array') 返字节数组 */
function sm4Block(kh, ih, inp, op, cbc) {
  const opts = cbc ? { mode: 'cbc', iv: ih } : {}
  const bytes = Array.from(inp)
  if (op === 'enc') return toHex(sm4.encrypt(bytes, kh, { ...opts, padding: 'none' }))
  return new Uint8Array(sm4.decrypt(bytes, kh, { ...opts, padding: 'none', output: 'array' }))
}
function sm4Ctr(kh, iv, inp) {
  const c = new Uint8Array(iv), o = new Uint8Array(inp.length)
  for (let off = 0; off < inp.length; off += BLOCK) {
    const ks = sm4Block(kh, '', c, 'enc', false)
    const n = Math.min(BLOCK, inp.length - off)
    for (let i = 0; i < n; i++) o[off + i] = inp[off + i] ^ ks[i]
    c[BLOCK - 1] = (c[BLOCK - 1] + 1) & 0xff
  }
  return o
}

function sm4Op(op, p) {
  const k = decodeInput(p.key, p.keyType, '密钥')
  if (k.length !== BLOCK) throw new Error('密钥长度必须为 128 位（16 字节）')
  const kh = fromHex(k)
  let iv = null, ih = ''
  if (p.mode === 'CBC' || p.mode === 'CTR') {
    if (!p.iv) throw new Error(`${p.mode} 模式向量不能为空！`)
    iv = decodeInput(p.iv, p.keyType, '向量')
    if (iv.length !== BLOCK) throw new Error('向量长度必须为 128 位（16 字节）')
    ih = fromHex(iv)
  }
  const d = decodeInput(p.data, op === 'enc' ? p.dataType : (p.dataType === 'TEXT' ? 'BASE64' : p.dataType), op === 'enc' ? '加密内容' : '解密内容')
  if (p.mode === 'CTR') {
    if (d.length % BLOCK) throw new Error('CTR 模式数据长度必须为 16 字节的整数倍')
    return sm4Ctr(kh, iv, d)
  }
  const raw = sm4Block(kh, ih, op === 'enc' ? pkcs7Pad(d) : d, op, p.mode === 'CBC')
  return op === 'enc' ? raw : pkcs7Unpad(raw)
}

function bytesToWA(b) {
  const w = []
  for (let i = 0; i < b.length; i++) w[i >>> 2] |= b[i] << (24 - (i % 4) * 8)
  return CryptoJS.lib.WordArray.create(w, b.length)
}

function aesOp(op, p) {
  const k = decodeInput(p.key, p.keyType, '密钥')
  if (k.length !== BLOCK) throw new Error('密钥长度必须为 128 位（16 字节）')
  const cbc = p.mode === 'CBC'
  const ctr = p.mode === 'CTR'
  let ivBytes = null
  if (cbc || ctr) {
    if (!p.iv) throw new Error(`${p.mode} 模式向量不能为空！`)
    ivBytes = decodeInput(p.iv, p.keyType, '向量')
    if (ivBytes.length !== BLOCK) throw new Error('向量长度必须为 128 位（16 字节）')
  }
  const d = decodeInput(p.data, op === 'enc' ? p.dataType : (p.dataType === 'TEXT' ? 'BASE64' : p.dataType), '加/解密内容')
  if (ctr && d.length % BLOCK) throw new Error('CTR 模式数据长度必须为 16 字节的整数倍')

  const opts = {
    mode: ctr ? CryptoJS.mode.CTR : cbc ? CryptoJS.mode.CBC : CryptoJS.mode.ECB,
    padding: ctr ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
  }
  if (ivBytes) opts.iv = bytesToWA(ivBytes)

  const res = op === 'enc'
    ? CryptoJS.AES.encrypt(bytesToWA(d), bytesToWA(k), opts)
    : CryptoJS.AES.decrypt({ ciphertext: bytesToWA(d) }, bytesToWA(k), opts)
  const ct = res.ciphertext || res
  const w = ct.words, sb = ct.sigBytes, out = new Uint8Array(sb)
  for (let i = 0; i < sb; i++) out[i] = (w[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
  return out
}

function operate(op, p) {
  return encodeOutput(p.algorithmName === 'SM4' ? sm4Op(op, p) : aesOp(op, p),
    op === 'enc' && p.resultType === 'TEXT' ? 'BASE64' : p.resultType)
}

let pass = 0, fail = 0
function eq(name, got, want) {
  if (got === want) pass++
  else { fail++; console.log(`  ✗ ${name}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`) }
}

const key16 = 'AAAAAAAAAAAAAAAAAAAAAA==' // 16 zero bytes (BASE64)
const iv16 = 'MTIzNDU2Nzg5MDEyMzQ1Ng=='   // '1234567890123456' (BASE64)

/** round-trip：明文 → 加密（cipherType 输出） → 解密（cipherType 输入，plainOut 输出） → 期望 plaintext */
function roundTrip({ algo, mode, key = key16, iv = iv16, keyType, dataType, plaintext, cipherType = 'BASE64', plainOut = 'TEXT' }) {
  const cipher = operate('enc', { algorithmName: algo, data: plaintext, key, iv, mode, dataType, resultType: cipherType, keyType })
  const decrypted = operate('dec', { algorithmName: algo, data: cipher, key, iv, mode, dataType: cipherType, resultType: plainOut, keyType })
  eq(`${algo}/${mode} dataType=${dataType} cipherType=${cipherType}`, decrypted, plaintext)
}

console.log('=== SM4 ECB ===')
roundTrip({ algo: 'SM4', mode: 'ECB', keyType: 'BASE64', dataType: 'TEXT', plaintext: 'hello' })
roundTrip({ algo: 'SM4', mode: 'ECB', keyType: 'BASE64', dataType: 'TEXT', plaintext: 'hello世界' })
roundTrip({ algo: 'SM4', mode: 'ECB', keyType: 'BASE64', dataType: 'TEXT', plaintext: '12345678abcdefgh', cipherType: 'HEX' })

console.log('=== SM4 CBC ===')
roundTrip({ algo: 'SM4', mode: 'CBC', keyType: 'BASE64', dataType: 'TEXT', plaintext: '12345678' })
roundTrip({ algo: 'SM4', mode: 'CBC', keyType: 'BASE64', dataType: 'TEXT', plaintext: 'abcdefghijklmnop' })

console.log('=== SM4 CTR ===')
// CTR 需要 16 字节倍数明文，BASE64 编码后正好 16 字节
const ctr16 = 'AAAAAAAAAAAAAAAAAAAAAA=='
roundTrip({ algo: 'SM4', mode: 'CTR', keyType: 'BASE64', dataType: 'BASE64', plaintext: ctr16, cipherType: 'BASE64', plainOut: 'BASE64' })
// CTR 拒绝非 block 倍数
try {
  sm4Op('enc', { algorithmName: 'SM4', data: 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY=', key: key16, iv: iv16, mode: 'CTR', dataType: 'TEXT', resultType: 'TEXT', keyType: 'BASE64' })
  fail++; console.log('  ✗ CTR 应拒绝非 block 倍数输入')
} catch (e) { eq('CTR 拒绝非 block 倍数输入', /16 字节/.test(e.message), true) }

console.log('=== AES ECB / CBC / CTR ===')
roundTrip({ algo: 'AES', mode: 'ECB', keyType: 'BASE64', dataType: 'TEXT', plaintext: 'hello' })
roundTrip({ algo: 'AES', mode: 'CBC', keyType: 'BASE64', dataType: 'TEXT', plaintext: 'hello world' })
roundTrip({ algo: 'AES', mode: 'CTR', keyType: 'BASE64', dataType: 'BASE64', plaintext: ctr16, cipherType: 'BASE64', plainOut: 'BASE64' })

console.log('=== HEX 密钥 ===')
roundTrip({ algo: 'AES', mode: 'CBC', key: '00000000000000000000000000000000', iv: '31323334353637383930313233343536', keyType: 'HEX', dataType: 'TEXT', plaintext: 'abcdefghijklmnopqrstuvwxyz' })

console.log('=== 异常路径 ===')
function expectThrow(label, params, expectedRegex) {
  try { sm4Op('enc', params); fail++; console.log(`  ✗ ${label} 应抛错`) }
  catch (e) { eq(label, expectedRegex.test(e.message), true) }
}
expectThrow('空 key 抛错', { algorithmName: 'SM4', data: 'x', key: '', iv: '', mode: 'ECB', dataType: 'TEXT', resultType: 'TEXT', keyType: 'BASE64' }, /密钥/)
expectThrow('CBC 缺 IV 抛错', { algorithmName: 'SM4', data: 'x', key: key16, iv: '', mode: 'CBC', dataType: 'TEXT', resultType: 'TEXT', keyType: 'BASE64' }, /向量/)
expectThrow('错长度 key 抛错', { algorithmName: 'SM4', data: 'x', key: 'AAA=', iv: '', mode: 'ECB', dataType: 'TEXT', resultType: 'TEXT', keyType: 'BASE64' }, /128 位/)

console.log(`\n=== ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)