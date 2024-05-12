export const cosmeticFilterParserErrorKinds = {
	invalidSugar: 'INVALID_SUGAR',
	invalidPatternHostname: 'INVALID_PATTERN_HOSTNAME',
	invalidPattern: 'INVALID_PATTERN',
	invalidOption: 'INVALID_OPTION',
} as const;

export class CosmeticFilterParserError extends Error {
	kind: string;

	constructor(kind: (typeof cosmeticFilterParserErrorKinds)[keyof typeof cosmeticFilterParserErrorKinds], message: string) {
		super(kind + ': ' + message);

		this.kind = kind;
		this.name = 'CosmeticFilterParserError';
	}
}
