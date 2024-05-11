import {ascii} from './codex.js';

export function isAlphabet(code: number) {
	return (code >= ascii.a && code <= ascii.z)
		|| (code >= ascii.A && code <= ascii.Z);
}

export function isNumeric(code: number) {
	return code >= ascii.n0 && code <= ascii.n9;
}

// RFC 952, 1123
// The digit can be a start of the domain
export function isHostnameCharacter(code: number) {
	return isAlphabet(code) || isNumeric(code);
}

export function isUrlCharacter(code: number) {
	if (code >= 63) {
		return code !== 96 && code <= 126;
	}

	if (code >= 42) {
		return code !== 62;
	}

	if (code >= 36) {
		return code <= 38;
	}

	return code === 33;
}
