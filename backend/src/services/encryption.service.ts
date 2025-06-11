import sodium from 'libsodium-wrappers';

class EncryptionService {
  private key!: Uint8Array;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await sodium.ready;
    // In a real application, this key would be securely managed and not hardcoded.
    this.key = new Uint8Array(sodium.crypto_secretbox_KEYBYTES);
    this.key.fill(1); 
  }

  encrypt(message: string): { ciphertext: string; nonce: string } {
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, this.key);
    return {
      ciphertext: Buffer.from(ciphertext).toString('hex'),
      nonce: Buffer.from(nonce).toString('hex'),
    };
  }

  decrypt(ciphertext: string, nonce: string): string {
    const ciphertextBytes = Buffer.from(ciphertext, 'hex');
    const nonceBytes = Buffer.from(nonce, 'hex');
    const decrypted = sodium.crypto_secretbox_open_easy(ciphertextBytes, nonceBytes, this.key);
    return Buffer.from(decrypted).toString();
  }
}

export const encryptionService = new EncryptionService();
