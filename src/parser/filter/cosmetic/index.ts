import {FilterType} from '../type.js';
import {consumeCosmeticFilterEffectiveTld, consumeCosmeticFilterSugars} from './consumers.js';
import {CosmeticFilterParserError, cosmeticFilterParserErrorKinds} from './errors.js';

export type CosmeticFilter = {
	type: FilterType.Cosmetic;
	pattern: string;
	hostname: string;
	isException: boolean;
	isCss: boolean;
	isExtendedCss: boolean;
	isScriptlet: boolean;

	isSyntaxBranchedByAdguard: boolean;
};

export function parseCosmeticFilter(line: string) {
	const filter: CosmeticFilter = {
		type: FilterType.Cosmetic,
		pattern: '',
		hostname: '',
		isException: false,
		isCss: false,
		isExtendedCss: false,
		isScriptlet: false,

		isSyntaxBranchedByAdguard: false,
	};

	const end = line.length;
	let pos = 0;

	const [afterEffectiveTld, effectiveTld] = consumeCosmeticFilterEffectiveTld(line, pos, end);
	pos = afterEffectiveTld;

	filter.hostname = effectiveTld;

	const [afterSugar, sugar] = consumeCosmeticFilterSugars(line, pos, end);
	pos = afterSugar;

	filter.isException = sugar.isException;
	filter.isCss = sugar.isCss;
	filter.isExtendedCss = sugar.isExtendedCss;
	filter.isScriptlet = sugar.isScriptlet;

	filter.isSyntaxBranchedByAdguard = sugar.isSyntaxBranchedByAdguard;

	if (pos >= end) {
		throw new CosmeticFilterParserError(
			cosmeticFilterParserErrorKinds.invalidPattern,
			'No selector was found!',
		);
	}

	filter.pattern = line.slice(pos);

	return filter;
}
