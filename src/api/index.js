// SM4/AES 已迁移到纯前端实现（src/utils/crypto.ts）。
// 这里仅保留旧函数签名以防外部模块仍 import；调用会立即 reject。
import axios from 'axios'
import { baseUrl } from './base.js'

const DEPRECATED = 'sm4Encrypt/sm4Decrypt 已废弃，请改用 src/utils/crypto 中的纯前端实现'

export const sm4Encrypt = () => Promise.reject(new Error(DEPRECATED))
export const sm4Decrypt = () => Promise.reject(new Error(DEPRECATED))

// 保留 baseUrl / axios 占位，避免破坏其它模块的导入
void axios; void baseUrl