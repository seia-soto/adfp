export const networkFilterParserErrorKinds = {
	invalidPatternHostname: 'INVALID_PATTERN_HOSTNAME',
	invalidPatternUrl: 'INVALID_PATTERN_URL',
	invalidPattern: 'INVALID_PATTERN',
	invalidOption: 'INVALID_OPTION',
} as const;

export class NetworkFilterParserError extends Error {
	kind: string;

	constructor(kind: (typeof networkFilterParserErrorKinds)[keyof typeof networkFilterParserErrorKinds], message: string) {
		super(kind + ': ' + message);

		this.kind = kind;
		this.name = 'NetworkFilterParserError';
	}
}
