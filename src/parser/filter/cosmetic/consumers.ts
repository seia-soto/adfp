import {ascii} from '../../../utils/codex.js';
import {isHostnameCharacter} from '../../../utils/patterns.js';
import {CosmeticFilterParserError, cosmeticFilterParserErrorKinds} from './errors.js';

export function consumeCosmeticFilterEffectiveTld(line: string, pos: number, end: number) {
	const start = pos;

	let code: number;
	let lastCode = -1;

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (code === ascii.dot) {
			if (lastCode === ascii.dot) {
				throw new CosmeticFilterParserError(
					cosmeticFilterParserErrorKinds.invalidPatternHostname,
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

	return [pos, line.slice(start, pos)] as const;
}

export function consumeCosmeticFilterSugars(line: string, pos: number, end: number) {
	for (; pos < end; pos++) {
		if (line.charCodeAt(pos) === ascii.numero) {
			break;
		}
	}

	if (pos === end) {
		throw new CosmeticFilterParserError(
			cosmeticFilterParserErrorKinds.invalidSugar,
			'The cosmetic filter sugar was not found!',
		);
	}

	let code: number;

	let isException = false;
	let isCss = false;
	let isExtendedCss = false;
	let isScriptlet = false;

	let isSyntaxBranchedByAdguard = false;

	code = line.charCodeAt(++pos);

	// Exception check
	if (code === ascii.at) {
		code = line.charCodeAt(++pos);
		isException = true;
	}

	// Extension check
	if (code === ascii.numero) {
		return [++pos, {
			isException,
			isCss,
			isExtendedCss,
			isScriptlet,

			isSyntaxBranchedByAdguard,
		}] as const;
	}

	if (code === ascii.dollar) {
		isCss = true;
	} else if (code === ascii.question) {
		isExtendedCss = true;
	} else if (code === ascii.percent) {
		isScriptlet = true;
	}

	isSyntaxBranchedByAdguard = true;
	code = line.charCodeAt(++pos);

	if (code !== ascii.numero) {
		throw new CosmeticFilterParserError(
			cosmeticFilterParserErrorKinds.invalidSugar,
			'The cosmetic filter sugar was not closed!',
		);
	}

	return [++pos, {
		isException,
		isCss,
		isExtendedCss,
		isScriptlet,

		isSyntaxBranchedByAdguard,
	}] as const;
}
