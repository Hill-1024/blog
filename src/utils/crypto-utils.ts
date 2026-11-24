/**
 * Native Web Crypto API utilities (PBKDF2 + AES-256-GCM).
 * Works identically in Node.js (build time) and browsers (runtime) with zero dependencies.
 */

const PAYLOAD_PREFIX = "MIZUKI-GCM-V1:";
const VERIFICATION_PREFIX = "MIZUKI-VERIFY:";
const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array): string {
	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}
	let binary = "";
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
	if (typeof Buffer !== "undefined") {
		return new Uint8Array(Buffer.from(base64, "base64"));
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function deriveKey(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
	usage: KeyUsage[],
): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await globalThis.crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return globalThis.crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		usage,
	);
}

/**
 * Encrypts plaintext content with PBKDF2-SHA256 + AES-256-GCM.
 */
export async function encryptContent(
	plaintext: string,
	password: string,
): Promise<string> {
	const encoder = new TextEncoder();
	const salt = globalThis.crypto.getRandomValues(
		new Uint8Array(SALT_BYTES),
	) as Uint8Array<ArrayBuffer>;
	const iv = globalThis.crypto.getRandomValues(
		new Uint8Array(IV_BYTES),
	) as Uint8Array<ArrayBuffer>;
	const key = await deriveKey(password, salt, ["encrypt"]);

	const data = encoder.encode(`${VERIFICATION_PREFIX}${plaintext}`);
	const encrypted = new Uint8Array(
		await globalThis.crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key,
			data,
		),
	);

	const combined = new Uint8Array(SALT_BYTES + IV_BYTES + encrypted.length);
	combined.set(salt, 0);
	combined.set(iv, SALT_BYTES);
	combined.set(encrypted, SALT_BYTES + IV_BYTES);

	return `${PAYLOAD_PREFIX}${toBase64(combined)}`;
}

/**
 * Decrypts payload encrypted by `encryptContent`. Returns null if password is invalid.
 */
export async function decryptContentPayload(
	payload: string,
	password: string,
): Promise<string | null> {
	if (!payload.startsWith(PAYLOAD_PREFIX) || !password) {
		return null;
	}

	try {
		const raw = fromBase64(payload.slice(PAYLOAD_PREFIX.length));
		if (raw.length <= SALT_BYTES + IV_BYTES) {
			return null;
		}

		const salt = raw.slice(0, SALT_BYTES) as Uint8Array<ArrayBuffer>;
		const iv = raw.slice(
			SALT_BYTES,
			SALT_BYTES + IV_BYTES,
		) as Uint8Array<ArrayBuffer>;
		const ciphertext = raw.slice(
			SALT_BYTES + IV_BYTES,
		) as Uint8Array<ArrayBuffer>;
		const key = await deriveKey(password, salt, ["decrypt"]);

		const decrypted = await globalThis.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			ciphertext,
		);
		const text = new TextDecoder().decode(decrypted);
		if (!text.startsWith(VERIFICATION_PREFIX)) {
			return null;
		}

		return text.slice(VERIFICATION_PREFIX.length);
	} catch {
		return null;
	}
}
