// /lib/payment-crypto.js
// AES-256-GCM encryption for payment gateway secret keys. Secret keys are
// live credentials that can move real money — they must never be stored
// in plain text, and PAYMENT_ENCRYPTION_KEY must never be committed or
// reused from any other purpose. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If this key is ever lost, every stored secret key becomes unrecoverable
// and admins will need to re-enter theirs.
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, 'hex');
}

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack iv + authTag + ciphertext together so we only need to store one string
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptSecret(packedBase64) {
  const data = Buffer.from(packedBase64, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// For display only — never send the real secret key back to the browser,
// not even to the admin who set it. Shows just enough to confirm it's set.
export function maskSecret(plaintext) {
  if (!plaintext || plaintext.length < 8) return '••••••••';
  return `${plaintext.slice(0, 4)}${'•'.repeat(8)}${plaintext.slice(-4)}`;
}
