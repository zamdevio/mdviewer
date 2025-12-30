import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Share text using Web Share API or clipboard fallback
 */
export async function shareText(text: string, title?: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ text, title });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encode string to base64 (UTF-8 safe)
 */
export function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Decode base64 string (UTF-8 safe)
 */
export function decodeBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Encrypt data using AES-GCM with a password
 * Uses Web Crypto API for secure encryption
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    // Convert password to key using PBKDF2
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key from password
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt the data
    const dataBytes = encoder.encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBytes
    );

    // Combine salt + iv + encrypted data and encode as base64
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64 safely (avoid spread operator issues with large arrays)
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
      binaryString += String.fromCharCode(combined[i]);
    }
    return encodeBase64(binaryString);
  } catch (error) {
    throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypt data using AES-GCM with a password
 * Uses Web Crypto API for secure decryption
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    if (!encryptedData || !encryptedData.trim()) {
      throw new Error('Encrypted data is empty');
    }

    if (!password || !password.trim()) {
      throw new Error('Password is required');
    }

    // Decode base64
    let combined: string;
    try {
      combined = decodeBase64(encryptedData);
    } catch (error) {
      throw new Error('Invalid base64 encoding');
    }

    // Check minimum size (salt 16 + iv 12 + at least some encrypted data)
    if (combined.length < 32) {
      throw new Error('Encrypted data is too short (corrupted file)');
    }

    const combinedBytes = new Uint8Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
      combinedBytes[i] = combined.charCodeAt(i);
    }

    // Extract salt, iv, and encrypted data
    const salt = combinedBytes.slice(0, 16);
    const iv = combinedBytes.slice(16, 28);
    const encrypted = combinedBytes.slice(28);

    if (encrypted.length === 0) {
      throw new Error('No encrypted data found (corrupted file)');
    }

    // Convert password to key using PBKDF2
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import password as key material
    let keyMaterial: CryptoKey;
    try {
      keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
    } catch (error) {
      throw new Error('Failed to import key material');
    }

    // Derive key from password (same parameters as encryption)
    let key: CryptoKey;
    try {
      key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
    } catch (error) {
      throw new Error('Failed to derive decryption key');
    }

    // Decrypt the data
    let decrypted: ArrayBuffer;
    try {
      decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );
    } catch (error) {
      // GCM mode will fail if password is wrong or data is corrupted
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('operation') || errorMsg.includes('decrypt')) {
        throw new Error('Incorrect password or corrupted data');
      }
      throw new Error('Decryption failed: ' + errorMsg);
    }

    // Convert decrypted bytes to string
    try {
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decode decrypted data');
    }
  } catch (error) {
    // Re-throw with more context if it's already our custom error
    if (error instanceof Error && error.message.includes('Incorrect password')) {
      throw error;
    }
    throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Check if a string appears to be encrypted (AES-GCM format)
 */
export function isEncryptedFormat(data: string): boolean {
  try {
    if (!data || data.trim().length === 0) {
      return false;
    }

    // Try to decode as base64
    const decoded = decodeBase64(data);
    
    // AES-GCM format: minimum 32 bytes (16 salt + 12 iv + at least 4 bytes encrypted)
    // Old format: contains ':' separator
    if (decoded.includes(':')) {
      return true; // Old format
    }
    
    if (decoded.length >= 32) {
      // Might be AES-GCM format - check if it's valid base64 and has minimum structure
      return true;
    }
    
    return false;
  } catch {
    // Not valid base64, likely plain JSON
    return false;
  }
}