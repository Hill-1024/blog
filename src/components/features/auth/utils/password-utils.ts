/**
 * Password utility functions for encryption/decryption
 *
 * Uses native Web Crypto API (PBKDF2 + AES-256-GCM) with zero external dependencies.
 */

import { decryptContentPayload } from "@/utils/crypto-utils";

/**
 * Decrypt content using native Web Crypto API
 */
export async function decryptContent(
	encryptedContent: string,
	password: string,
): Promise<string | null> {
	return decryptContentPayload(encryptedContent, password);
}

/**
 * Retained for backward compatibility; native Web Crypto requires no external script.
 */
export async function loadCryptoLibraries(): Promise<void> {}
