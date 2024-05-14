import {FilterParserError} from '../../errors.js';

export const preprocessorParserErrorKinds = {
	invalidSignature: 'INVALID_SIGNATURE',
	invalidOperator: 'INVALID_OPERATOR',
	invalidValue: 'INVALID_VALUE',
} as const;

export class PreprocessorParserError extends FilterParserError {
	kind: string;

	constructor(kind: (typeof preprocessorParserErrorKinds)[keyof typeof preprocessorParserErrorKinds], message: string) {
		super(kind + ': ' + message);

		this.kind = kind;
		this.name = 'PreprocessorParserError';
	}
}
