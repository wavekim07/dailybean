// 관리자 비밀번호 해시 (브라우저 내장 Web Crypto, https 또는 localhost에서만 동작)
// 비밀번호는 저장하지 않고, 되돌릴 수 없게 섞은 값(해시)만 저장해요.
// 방식: PBKDF2-HMAC-SHA256, 60만 번 반복, 사람마다 다른 무작위 솔트
// 근거: OWASP Password Storage Cheat Sheet (PBKDF2-HMAC-SHA256 600,000 iterations 권장, 비밀번호마다 고유한 솔트)

export const ITERATIONS = 600000

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)))

async function derive(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256)
  return toHex(bits)
}

// 새 비밀번호 → { salt, hash, iterations }
export async function hashSecret(password) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  return { salt, hash: await derive(password, salt, ITERATIONS), iterations: ITERATIONS }
}

// 입력한 비밀번호를 같은 방법으로 섞어서 저장된 해시와 비교
export async function verifySecret(password, record) {
  if (!record?.hash) return false
  const h = await derive(password, record.salt, record.iterations || ITERATIONS)
  // 길이가 같은 문자열을 끝까지 비교 (앞에서 틀린 위치에 따라 걸리는 시간이 달라지지 않게)
  let diff = h.length ^ record.hash.length
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ (record.hash.charCodeAt(i) || 0)
  return diff === 0
}

// 관리자 비밀번호를 잊었을 때 쓰는 복구 코드 (헷갈리는 글자 0/O, 1/I/L 제외)
export function recoveryCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const r = crypto.getRandomValues(new Uint8Array(12))
  const s = [...r].map((n) => chars[n % chars.length]).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`
}
