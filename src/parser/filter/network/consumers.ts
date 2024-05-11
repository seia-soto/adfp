import {ascii} from '../../../utils/codex.js';
import {
	isHostnameCharacter,
	isUrlCharacter,
} from '../../../utils/patterns.js';
import {
	NetworkFilterParserError,
	networkFilterParserErrorKinds,
} from './errors.js';

export function consumeNetworkFilterException(line: string, pos: number) {
	if (line.charCodeAt(pos) === ascii.at) {
		if (line.charCodeAt(pos + 1) === ascii.at) {
			return [pos + 2, true] as const;
		}

		throw new NetworkFilterParserError(
			networkFilterParserErrorKinds.invalidPattern,
			'Leading an at symbol is not expected!',
		);
	}

	return [pos, false] as const;
}

export function consumeNetworkFilterHeader(line: string, pos: number) {
	let isFullUrlMatchedByPatternFromForward = false; // |
	let isEffectiveTldExpectedFromPattern = false; // ||
	let isSeparatorTokenMatchedByPatternFromForward = false; // ^
	let isRegexpPatternCandidate = false; // /

	let code = line.charCodeAt(pos);

	if (code === ascii.slash) {
		isRegexpPatternCandidate = true;

		return [pos, {
			isFullUrlMatchedByPatternFromForward,
			isEffectiveTldExpectedFromPattern,
			isSeparatorTokenMatchedByPatternFromForward,
			isRegexpPatternCandidate,
		}] as const;
	}

	if (code === ascii.pipe) {
		code = line.charCodeAt(++pos);
		isFullUrlMatchedByPatternFromForward = !isFullUrlMatchedByPatternFromForward;

		if (code === ascii.pipe) {
			code = line.charCodeAt(++pos);
			isFullUrlMatchedByPatternFromForward = !isFullUrlMatchedByPatternFromForward;
			isEffectiveTldExpectedFromPattern = true;
		}
	}

	if (code === ascii.hat) {
		code = line.charCodeAt(++pos);
		isSeparatorTokenMatchedByPatternFromForward = true;
		// ||^, which doesn't make sense
		isEffectiveTldExpectedFromPattern = false;
		// |^, which doesn't make sense
		isFullUrlMatchedByPatternFromForward = false;
	}

	return [pos, {
		isFullUrlMatchedByPatternFromForward,
		isEffectiveTldExpectedFromPattern,
		isSeparatorTokenMatchedByPatternFromForward,
		isRegexpPatternCandidate,
	}] as const;
}

export function consumeNetworkFilterFooter(line: string, pos: number) {
	let isFullUrlMatchedByPatternFromBackward = false; // |
	let isSeparatorTokenMatchedByPatternFromBackward = false; // ^

	let code = line.charCodeAt(pos);

	if (code === ascii.hat) {
		code = line.charCodeAt(++pos);
		isSeparatorTokenMatchedByPatternFromBackward = true;
	}

	if (code === ascii.pipe) {
		code = line.charCodeAt(++pos);
		isFullUrlMatchedByPatternFromBackward = true;
	}

	return [pos, {
		isFullUrlMatchedByPatternFromBackward,
		isSeparatorTokenMatchedByPatternFromBackward,
	}] as const;
}

export function consumeNetworkFilterPattern(line: string, pos: number, end: number) {
	let start = pos;

	let code: number;
	let lastCode = -1;

	let hostnameStart = start;
	let hostname = '';
	let isHostnameEffectiveTld = true;

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.slash) {
			if (
				hostnameStart !== -1
				&& (pos - hostnameStart) !== 0
			) {
				hostname = line.slice(hostnameStart, pos);

				if (hostnameStart === start) {
					start = pos;
				}
			}

			hostnameStart = -1;

			if (lastCode === ascii.slash) {
				if (line.charCodeAt(pos - 2) !== ascii.colon) {
					throw new NetworkFilterParserError(
						networkFilterParserErrorKinds.invalidPatternUrl,
						'Consecutive slashes are not expected!',
					);
				}

				hostnameStart = pos + 1;
				isHostnameEffectiveTld = false;
			}
		} else if (code === ascii.dot) {
			if (lastCode === ascii.dot) {
				hostnameStart = -1;
			}
		} else if (!isHostnameCharacter(code)) {
			hostnameStart = -1;
		}

		lastCode = code;
	}

	if ((pos - start) === 0) {
		throw new NetworkFilterParserError(
			networkFilterParserErrorKinds.invalidPattern,
			'Pattern of zero length is not expected!',
		);
	}

	if (hostnameStart !== -1) {
		if (start === hostnameStart) {
			return [pos, {
				pattern: '',
				hostname: line.slice(hostnameStart, pos),
				isHostnameEffectiveTld,
			}] as const;
		}

		return [pos, {
			pattern: line.slice(start, pos),
			hostname: line.slice(hostnameStart, pos),
			isHostnameEffectiveTld,
		}] as const;
	}

	return [pos, {
		pattern: line.slice(start, pos),
		hostname,
		isHostnameEffectiveTld,
	}] as const;
}

export function consumeNetworkFilterPatternAsEffectiveTld(line: string, pos: number, end: number) {
	const start = pos;

	let code: number;
	let lastCode = -1;

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.dot) {
			if (lastCode === ascii.dot) {
				throw new NetworkFilterParserError(
					networkFilterParserErrorKinds.invalidPatternHostname,
					'Consecutive dots are not expected!',
				);
			}
		} else if (
			!isHostnameCharacter(code)
			&& code !== ascii.hyphen
		) {
			break;
		}

		lastCode = code;
	}

	if ((pos - start) === 0) {
		throw new NetworkFilterParserError(
			networkFilterParserErrorKinds.invalidPattern,
			'Effective TLD of zero length is not expected!',
		);
	}

	return [pos, line.slice(start, pos)] as const;
}

export function consumeNetworkFilterPatternAsUri(line: string, pos: number, end: number) {
	const start = pos;

	for (; pos < end; pos++) {
		if (!isUrlCharacter(line.charCodeAt(pos))) {
			break;
		}
	}

	return [pos, line.slice(start, pos)] as const;
}

export function consumeNetworkFilterAsRemainingRegexp(line: string, pos: number, end: number) {
	if (line.charCodeAt(end - 1) === ascii.slash) {
		return [end, line.slice(pos)] as const;
	}

	const start = pos;

	let code: number;
	let lastCode = line.charCodeAt(pos - 1);

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.escape) {
			pos++;
		} else if (code === ascii.dollar) {
			if (lastCode === ascii.slash) {
				return [pos, line.slice(start, pos)] as const;
			}
		}

		lastCode = code;
	}

	return [start, undefined] as const;
}

function consumeNetworkFilterOptionKey(line: string, pos: number, end: number) {
	const start = pos;

	let code: number;
	let underbarsCount = 0;

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.underscore) {
			underbarsCount++;
		} else if (code === ascii.equal || code === ascii.comma) {
			break;
		}
	}

	code = pos - start;

	if (code === 0) {
		throw new NetworkFilterParserError(
			networkFilterParserErrorKinds.invalidOption,
			'The key of an option is expected!',
		);
	}

	if (code === underbarsCount) {
		return [pos, undefined] as const;
	}

	return [pos, line.slice(start, pos)] as const;
}

function consumeNetworkFilterOptionValue(line: string, pos: number, end: number) {
	let code: number;
	let value = '';

	if (line.charCodeAt(pos) === ascii.equal) {
		pos++;
	}

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.escape) {
			value += line.charAt(pos + 1);

			pos++;
		} else if (code === ascii.comma) {
			break;
		} else {
			value += line.charAt(pos);
		}
	}

	if (value.length === 0) {
		return [pos, undefined] as const;
	}

	return [pos, value] as const;
}

export function consumeNetworkFilterOptions(line: string, pos: number, end: number) {
	const options: Array<[string, string | undefined]> = [];

	let key: string | undefined;
	let value: string | undefined;

	for (; pos < end; pos++) {
		[pos, key] = consumeNetworkFilterOptionKey(line, pos, end);

		if (key !== undefined) {
			[pos, value] = consumeNetworkFilterOptionValue(line, pos, end);

			options.push([key, value]);
		}
	}

	return options;
}
