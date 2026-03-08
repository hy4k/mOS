import CryptoJS from 'crypto-js';

export function encrypt(text: string, masterPassword: string): string {
  return CryptoJS.AES.encrypt(text, masterPassword).toString();
}

export function decrypt(ciphertext: string, masterPassword: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, masterPassword);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Decryption failed. Check master password.';
  }
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}
