// 端到端对比：原后端 vs 前端实现（SM4 全模式 / 全 dataType / 全 keyType）
// 跑法：node scripts/compare-backend-vs-frontend.mjs
// 后端默认 localhost:8080。Node 14 没有 fetch，用 http 模块。
// 这里的前端实现复刻 src/utils/crypto.ts（Node 不支持 TS），用作对比基线。

import CryptoJS from 'crypto-js'
import smCrypto from 'sm-crypto'
import http from 'http'
const { sm4 } = smCrypto

const HOST = 'localhost'
const PORT = 8080
const BLOCK = 16

// ====== 前端等价实现（与 src/utils/crypto.ts 算法对齐）======

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
function frontendSm4(op, p) {
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
  let raw
  if (p.mode === 'CTR') {
    if (d.length % BLOCK) throw new Error('CTR 模式数据长度必须为 16 字节的整数倍')
    raw = sm4Ctr(kh, iv, d)
  } else {
    raw = sm4Block(kh, ih, op === 'enc' ? pkcs7Pad(d) : d, op, p.mode === 'CBC')
    if (op === 'dec') raw = pkcs7Unpad(raw)
  }
  // 对齐原页面 label：加密时 TEXT = BASE64；解密时 TEXT = UTF-8
  const resultType = op === 'enc' && p.resultType === 'TEXT' ? 'BASE64' : p.resultType
  return encodeOutput(raw, resultType)
}

// ====== 后端 HTTP ======

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request({
      hostname: HOST, port: PORT, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { reject(new Error('bad json: ' + e.message)) }
      })
    })
    req.on('error', reject)
    req.write(data); req.end()
  })
}

async function backendSm4(op, p) {
  const path = op === 'enc' ? '/sm4/encrypt' : '/sm4/decrypt'
  const json = await postJson(path, {
    algorithmName: 'SM4', data: p.data, key: p.key, iv: p.iv ?? '',
    mode: p.mode, dataType: p.dataType, resultType: p.resultType ?? 'TEXT', keyType: p.keyType,
  })
  if (!json.success || json.code !== 200) throw new Error(`backend ${op} failed: ${JSON.stringify(json)}`)
  return json.data.data
}

// ====== 测试矩阵 ======

const KEY = { BASE64: 'AAAAAAAAAAAAAAAAAAAAAA==', HEX: '00000000000000000000000000000000' }
const IV  = { BASE64: 'MTIzNDU2Nzg5MDEyMzQ1Ng==',   HEX: '31323334353637383930313233343536' }
const MODES = ['ECB', 'CBC', 'CTR']
const KEY_TYPES = ['BASE64', 'HEX']
const PLAINTEXTS = [
  { name: 'short_ascii',     data: 'hello',                              dataType: 'TEXT' },
  { name: 'chinese',         data: '你好世界, hello',                     dataType: 'TEXT' },
  { name: 'special_chars',   data: 'a\x00b\xffc\nd',                     dataType: 'TEXT' },
  { name: 'block_aligned_16',data: '1234567890abcdef',                   dataType: 'TEXT' },
  { name: 'block_aligned_32',data: '1234567890abcdef1234567890abcdef',   dataType: 'TEXT' },
  { name: 'hex_input',       data: '48656c6c6f20576f726c64',             dataType: 'HEX' },
  { name: 'b64_input',       data: 'SGVsbG8gV29ybGQ=',                    dataType: 'BASE64' },
]
// CTR 必须 16 字节倍数
const CTR_PLAINTEXTS = [
  { name: 'ctr_16_zero',     data: 'AAAAAAAAAAAAAAAAAAAAAA==', dataType: 'BASE64' },
  { name: 'ctr_32_chinese',  data: Buffer.from('你好世界'.repeat(4)).toString('base64'), dataType: 'BASE64' },
]
const makeKey = kt => KEY[kt]
const makeIV  = kt => IV[kt]

// ====== 对比 ======

let pass = 0, fail = 0
const failures = []

async function compare(label, params, op) {
  // CTR 加密且输入非 block 倍数 → 前后端都会报错，skip
  if (op === 'enc' && params.mode === 'CTR') {
    const plainBytes = decodeInput(params.data, params.dataType, 'data')
    if (plainBytes.length % BLOCK !== 0) return
  }
  let backendOut, frontendOut
  try { backendOut = await backendSm4(op, params) }
  catch (e) { fail++; failures.push({ label, op, err: 'backend: ' + e.message }); return }
  try { frontendOut = frontendSm4(op, params) }
  catch (e) { fail++; failures.push({ label, op, err: 'frontend: ' + e.message }); return }
  if (backendOut === frontendOut) pass++
  else { fail++; failures.push({ label, op, params, backendOut, frontendOut }) }
}

function encParams(mode, pt, keyType, resultType = 'BASE64') {
  return {
    algorithmName: 'SM4', mode,
    data: pt.data, key: makeKey(keyType),
    iv: mode === 'ECB' ? '' : makeIV(keyType),
    dataType: pt.dataType, resultType, keyType,
  }
}

async function run() {
  console.log('===== 加密对比 =====')
  for (const mode of MODES) {
    const texts = mode === 'CTR' ? CTR_PLAINTEXTS : PLAINTEXTS
    for (const pt of texts) {
      for (const kt of KEY_TYPES) {
        // resultType=BASE64：标准用法
        await compare(`enc/${mode}/${pt.name}/${kt}/BASE64`, encParams(mode, pt, kt, 'BASE64'), 'enc')
        // resultType=TEXT：验证原页面 label「加密为Base64」语义
        await compare(`enc/${mode}/${pt.name}/${kt}/TEXT`,   encParams(mode, pt, kt, 'TEXT'),   'enc')
      }
    }
  }

  console.log('===== 解密对比 =====')
  for (const mode of MODES) {
    const texts = mode === 'CTR' ? CTR_PLAINTEXTS : PLAINTEXTS
    for (const pt of texts) {
      for (const kt of KEY_TYPES) {
        const enc = encParams(mode, pt, kt, 'BASE64')
        let cipher
        try { cipher = await backendSm4('enc', enc) }
        catch (e) { fail++; failures.push({ label: 'dec-prep', err: e.message }); continue }
        // 密文是 base64 字符串，解密 dataType=BASE64、resultType=TEXT
        await compare(`dec/${mode}/${pt.name}/${kt}/BASE64`,
          { ...enc, data: cipher, dataType: 'BASE64', resultType: 'TEXT' }, 'dec')
      }
    }
  }

  console.log('\n===== 汇总 =====')
  console.log(`PASS: ${pass}`)
  console.log(`FAIL: ${fail}`)
  if (fail > 0) {
    console.log('\n失败用例:')
    for (const f of failures.slice(0, 20)) console.log(JSON.stringify(f, null, 2))
    if (failures.length > 20) console.log(`... 还有 ${failures.length - 20} 个`)
  }
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })