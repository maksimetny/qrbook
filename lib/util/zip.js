'use strict';

import { uint8ArrayToBase64, uint8ArrayFromBase64 } from './common.js';

/** @type {CompressionFormat} */
const ALGORITHM = 'deflate-raw';

/**
@param {string} text
@param {boolean} [urlSafe]
*/
export async function deflate(text, algorithm = ALGORITHM, urlSafe) {
	const stream = new Blob([text])
		.stream()
		.pipeThrough(new CompressionStream(algorithm));

	return uint8ArrayToBase64(await new Response(stream).bytes());
}

/**
@param {string} base64
@param {boolean} [urlSafe]
*/
export async function inflate(base64, algorithm = ALGORITHM, urlSafe) {
	const stream = new Blob([uint8ArrayFromBase64(base64, urlSafe)])
		.stream()
		.pipeThrough(new DecompressionStream(algorithm));

	return await new Response(stream).text();
}
