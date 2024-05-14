import {ascii} from '../../../utils/codex.js';
import {isAlphabet} from '../../../utils/patterns.js';
import {
	PreprocessorParserError,
	preprocessorParserErrorKinds,
} from './errors.js';
import {Component} from './index.js';

export function consumePreprocessorValue(line: string, pos: number, end: number) {
	const start = pos;

	let code: number;

	for (; pos < end; pos++) {
		code = line.charCodeAt(pos);

		if (!isAlphabet(code) && code !== ascii.underscore) {
			break;
		}
	}

	if ((pos - start) === 0) {
		throw new PreprocessorParserError(
			preprocessorParserErrorKinds.invalidValue,
			'The zero length of the expression value is not allowed!',
		);
	}

	return [pos, line.slice(start, pos)] as const;
}

export function consumePreprocessorOperator(line: string, pos: number): [number, Component] {
	const code = line.charCodeAt(pos++);

	if (code === ascii.and) {
		if (line.charCodeAt(pos++) !== ascii.and) {
			throw new PreprocessorParserError(
				preprocessorParserErrorKinds.invalidOperator,
				'Only consecutive operators is expected!',
			);
		}

		return [pos, Component.And] as const;
	}

	if (code === ascii.pipe) {
		if (line.charCodeAt(pos++) !== ascii.pipe) {
			throw new PreprocessorParserError(
				preprocessorParserErrorKinds.invalidOperator,
				'Only consecutive operators is expected!',
			);
		}

		return [pos, Component.Or] as const;
	}

	if (code === ascii.parenthesisOpen) {
		return [pos, Component.ParenthesisOpen] as const;
	}

	if (code === ascii.parenthesisClose) {
		return [pos, Component.ParenthesisClose] as const;
	}

	throw new PreprocessorParserError(
		preprocessorParserErrorKinds.invalidOperator,
		'The operator must be logical AND or OR!',
	);
}
