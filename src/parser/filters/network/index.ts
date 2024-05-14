import {ascii} from '../../../utils/codex.js';
import {FilterType} from '../../types.js';
import {
	consumeNetworkFilterException,
	consumeNetworkFilterFooter,
	consumeNetworkFilterHeader,
	consumeNetworkFilterOptions,
	consumeNetworkFilterPattern,
	consumeNetworkFilterPatternAsEffectiveTld,
	consumeNetworkFilterPatternAsUri,
} from './consumers.js';
import {
	NetworkFilterParserError,
	networkFilterParserErrorKinds,
} from './errors.js';
import {indexOfOptions} from './utils.js';

export type NetworkFilter = {
	type: FilterType.Network;
	pattern: string;
	hostname: string;
	isException: boolean;
	isEffectiveTld: boolean;
	isFullUrlMatchedByPatternFromForward: boolean;
	isSeparatorTokenMatchedByPatternFromForward: boolean;
	isFullUrlMatchedByPatternFromBackward: boolean;
	isSeparatorTokenMatchedByPatternFromBackward: boolean;
	isRegexp: boolean;
	options: Array<[string, string | undefined]>;
};

export function parseNetworkFilter(line: string) {
	const filter: NetworkFilter = {
		type: FilterType.Network,
		pattern: '',
		hostname: '',
		isException: false,
		isEffectiveTld: false,
		isFullUrlMatchedByPatternFromForward: false,
		isSeparatorTokenMatchedByPatternFromForward: false,
		isFullUrlMatchedByPatternFromBackward: false,
		isSeparatorTokenMatchedByPatternFromBackward: false,
		isRegexp: false,
		options: [],
	};

	const lineEnd = line.length;
	let pos = 0;

	// Check for leading @@ pattern
	const [afterException, isException] = consumeNetworkFilterException(line, pos);
	pos = afterException;

	filter.isException = isException;

	// Check for the type of this filter for futher optimisation
	const [afterHeader, header] = consumeNetworkFilterHeader(line, pos);
	pos = afterHeader;

	filter.isFullUrlMatchedByPatternFromForward = header.isFullUrlMatchedByPatternFromForward;
	filter.isSeparatorTokenMatchedByPatternFromForward = header.isSeparatorTokenMatchedByPatternFromForward;

	let patternEnd = indexOfOptions(line, lineEnd, header.isRegexpPatternCandidate);

	if (patternEnd === -1) {
		patternEnd = lineEnd;
	}

	if (header.isRegexpPatternCandidate && line.charCodeAt(patternEnd - 1) === ascii.slash) {
		pos = patternEnd;

		filter.isRegexp = true;
		filter.pattern = line.slice(0, patternEnd);
	} else {
		// If the rest is expected to start with an effective tld (Check for leading || pattern)
		if (header.isEffectiveTldExpectedFromPattern) {
			const [afterEffectiveTld, effectiveTld] = consumeNetworkFilterPatternAsEffectiveTld(line, afterHeader, patternEnd);
			pos = afterEffectiveTld;

			filter.hostname = effectiveTld;
			filter.isEffectiveTld = true;

			if (line.charCodeAt(pos) === ascii.slash) {
				const [afterUri, uri] = consumeNetworkFilterPatternAsUri(line, afterEffectiveTld, patternEnd);
				pos = afterUri;

				filter.pattern = uri;
			}
		} else {
			const [afterBody, body] = consumeNetworkFilterPattern(line, afterHeader, patternEnd);
			pos = afterBody;

			if (
				!header.isFullUrlMatchedByPatternFromForward
				&& !header.isSeparatorTokenMatchedByPatternFromForward
				&& body.isHostnameEffectiveTld
				&& body.hostname.length !== 0
			) {
				filter.isEffectiveTld = true;
			}

			filter.hostname = body.hostname;
			filter.pattern = body.pattern;
		}

		const [afterFooter, footer] = consumeNetworkFilterFooter(line, pos);
		pos = afterFooter;

		filter.isFullUrlMatchedByPatternFromBackward = footer.isFullUrlMatchedByPatternFromBackward;
		filter.isSeparatorTokenMatchedByPatternFromBackward = footer.isSeparatorTokenMatchedByPatternFromBackward;
	}

	// The position of the both regexp filter and non-regexp filter will point the dollar sign
	if (lineEnd === patternEnd) {
		return filter;
	}

	// Check for options
	if (line.charCodeAt(pos) !== ascii.dollar) {
		throw new NetworkFilterParserError(
			networkFilterParserErrorKinds.invalidPattern,
			'Only dollar sign is expected after the pattern!',
		);
	}

	filter.options = consumeNetworkFilterOptions(line, ++pos, lineEnd);

	return filter;
}
