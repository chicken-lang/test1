/**
 * useCrypto - RSA 加密封装
 *
 * 对应《前端项目完善优化开发方案》4.3 节 RSA 加密实现（解决 G5）。
 * 职责:
 *  1. 获取后端 RSA 公钥（带 Promise 缓存，避免并发重复请求）
 *  2. RSA-OAEP 加密敏感字段（登录密码 / 涉密正文）
 *  3. 公钥不可用时降级 SHA-256（仅开发 Mock 兼容模式，生产后端必须配置 RSA）
 *
 * 使用方式:
 *   const { encrypt } = useCrypto()
 *   const { cipher, keyVersion, mode } = await encrypt(password)
 *   // mode: 'rsa' | 'sha256'（rsa 失败或无公钥时降级）
 *
 * 注意:
 *  - JSEncrypt / crypto.subtle 仅在客户端可用，本 composable 只在浏览器环境调用
 *    （登录、表单提交均在客户端触发，SSR 不会执行到此）
 *  - 公钥缓存仅运行时内存，不写入 localStorage，登出时由 clearCache() 清除
 */
import JSEncrypt from 'jsencrypt'

/** 加密结果 */
export interface CryptoResult {
  /** 加密后的密文（RSA 为 Base64，SHA-256 为 16 进制） */
  cipher: string
  /** RSA 公钥版本（mode='rsa' 时有值，供后端定位私钥） */
  keyVersion?: string
  /** 实际使用的加密模式 */
  mode: 'rsa' | 'sha256'
}

/** 公钥缓存结构 */
interface RsaKeyInfo {
  publicKey: string
  keyVersion: string
}

/**
 * 运行时内存中的公钥 Promise 缓存
 * 缓存 Promise 本身，避免并发登录重复请求公钥接口
 */
let rsaPublicKeyPromise: Promise<RsaKeyInfo | null> | null = null

/** 清除公钥缓存（登出时调用，下次登录重新获取） */
export function clearRsaKeyCache() {
  rsaPublicKeyPromise = null
}

/**
 * SHA-256 前端固定哈希（兼容模式，RSA 公钥未配置时使用）
 * 注意：SHA-256 不可逆但非加密传输，仅用于开发 Mock，生产必须 RSA
 */
async function sha256(plaintext: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 获取 RSA 公钥（带 Promise 缓存）
 * 若后端未配置 RSA 密钥或请求失败，返回 null → 调用方降级到 SHA-256
 */
function fetchRsaPublicKey(): Promise<RsaKeyInfo | null> {
  if (rsaPublicKeyPromise) return rsaPublicKeyPromise
  rsaPublicKeyPromise = $fetch<any>('/api/auth/public-key')
    .then((res) => {
      if (res?.code === 0 && res.data?.publicKey) {
        return { publicKey: res.data.publicKey, keyVersion: res.data.keyVersion }
      }
      return null
    })
    .catch(() => null)
  return rsaPublicKeyPromise
}

/**
 * RSA-OAEP 加密明文
 * @returns Base64 编码的密文；加密失败返回 null（调用方降级）
 */
function rsaEncrypt(plaintext: string, publicKeyPem: string): string | null {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKeyPem)
  const encrypted = encryptor.encrypt(plaintext)
  if (encrypted === false) return null
  return encrypted
}

export const useCrypto = () => {
  /**
   * 加密明文：优先 RSA-OAEP，公钥不可用或加密失败时降级 SHA-256
   * @param plaintext 明文（如密码）
   * @returns { cipher, keyVersion?, mode }
   */
  const encrypt = async (plaintext: string): Promise<CryptoResult> => {
    const rsaKey = await fetchRsaPublicKey()
    if (rsaKey) {
      const encrypted = rsaEncrypt(plaintext, rsaKey.publicKey)
      if (encrypted) {
        return { cipher: encrypted, keyVersion: rsaKey.keyVersion, mode: 'rsa' }
      }
      // RSA 加密失败 → 降级
    }
    // 无 RSA 公钥或加密失败 → SHA-256 兼容模式
    return { cipher: await sha256(plaintext), mode: 'sha256' }
  }

  /** 预加载 RSA 公钥（登录页 onMounted 时调用，提前暖接口） */
  const preloadRsaKey = async (): Promise<void> => {
    await fetchRsaPublicKey()
  }

  return { encrypt, preloadRsaKey }
}
