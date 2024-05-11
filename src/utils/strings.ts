import {ascii} from './codex.js';

export function indexOfUnescapedCharacter(buf: string, charCode: number, startIndex = 0, endIndex = buf.length) {
	for (let i = startIndex; i < endIndex; i++) {
		if (buf.charCodeAt(i) === ascii.escape) {
			i++;
		} else if (buf.charCodeAt(i) === charCode) {
			return i;
		}
	}

	return -1;
}

export function lastIndexOfUnescapedCharacter(buf: string, charCode: number, startIndex = 0, endIndex = buf.length) {
	for (let i = endIndex; i > startIndex; i--) {
		if (buf.charCodeAt(i) === charCode) {
			if (buf.charCodeAt(i - 1) !== ascii.escape) {
				return i;
			}

			i--;
		}
	}

	return -1;
}
