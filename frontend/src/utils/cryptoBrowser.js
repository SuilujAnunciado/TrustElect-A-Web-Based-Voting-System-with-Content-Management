<<<<<<< HEAD
=======
// Minimal browser AES-256-GCM decrypt helper compatible with backend cryptoService outputs
// Expects hex strings for encrypted, iv, authTag, key
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b

function hexToBytes(hex) {
	if (typeof hex !== 'string') throw new Error('Expected hex string');
	const clean = hex.trim();
	if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
	}
	return bytes;
}

async function decryptAesGcmHex({ encrypted, iv, authTag, key }) {
	if (!encrypted || !iv || !authTag || !key) {
		throw new Error('Missing required fields: encrypted, iv, authTag, key');
	}

	const ivBytes = hexToBytes(iv);
	const keyBytes = hexToBytes(key);
	const ctBytes = hexToBytes(encrypted);
	const tagBytes = hexToBytes(authTag);

<<<<<<< HEAD
=======
	// WebCrypto expects ciphertext with tag appended at the end
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
	const sealed = new Uint8Array(ctBytes.length + tagBytes.length);
	sealed.set(ctBytes, 0);
	sealed.set(tagBytes, ctBytes.length);

	const cryptoObj = globalThis.crypto || globalThis.msCrypto;
	if (!cryptoObj || !cryptoObj.subtle) throw new Error('Web Crypto API not available in this environment');

	const cryptoKey = await cryptoObj.subtle.importKey(
		'raw',
		keyBytes,
		{ name: 'AES-GCM' },
		false,
		['decrypt']
	);

	const plaintextBuffer = await cryptoObj.subtle.decrypt(
		{ name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
		cryptoKey,
		sealed
	);

	const decoder = new TextDecoder();
	const text = decoder.decode(new Uint8Array(plaintextBuffer));
	try {
		return JSON.parse(text);
	} catch (e) {
		return text;
	}
}

export { hexToBytes, decryptAesGcmHex };


