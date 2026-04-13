'use strict';

/**
@param {TemplateStringsArray} segments
@param {...unknown} interpolations
*/
export const str = (segments, ...interpolations) => segments.reduce((text, segment, i) => {
	return text + segment + (Array.isArray(interpolations[i]) ?
		interpolations[i].join(String()) :
		(interpolations[i] ? interpolations[i] : String()));
}, String());

/**
@overload
@param {number} max
@returns {number}
@insecure
*/
/**
@overload
@param {number} min
@param {number} max
@returns {number}
@insecure
*/
export function randomInt(min, max) {
	if (max === undefined) {
		max = min;
		min = 0;
	}

	min = Math.ceil(min);
	max = Math.floor(max);

	return Math.floor(Math.random() * (max - min)) + min;
}

/** @param {string} base64 */
export function base64ToUrl(base64) {
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, String());
}

/** @param {string} base64Url */
export function base64FromUrl(base64Url) {
	return base64Url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64Url.length % 4)) % 4);
}

/**
@param {Uint8Array} buffer
@returns {string}
*/
export function uint8ArrayToBase64(buffer, urlSafe = true) {
	if (typeof buffer.toBase64 !== 'function') {
		const base64 = btoa(Array.from(buffer, byte => String.fromCharCode(byte)).join(String()));
		return urlSafe ? base64ToUrl(base64) : base64;
	}

	return buffer.toBase64({
		alphabet: urlSafe ? 'base64url' : 'base64',
		omitPadding: urlSafe
	});
}

/**
@param {string} base64
@returns {Uint8Array}
*/
export function uint8ArrayFromBase64(base64, urlSafe = true) {
	if (typeof Uint8Array.fromBase64 !== 'function')
		return Uint8Array.from(atob(urlSafe ? base64FromUrl(base64) : base64), c => c.charCodeAt(0));

	return Uint8Array.fromBase64(base64, {
		alphabet: urlSafe ? 'base64url' : 'base64',
		omitPadding: urlSafe
	});
}
