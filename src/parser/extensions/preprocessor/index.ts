import {ascii} from '../../../utils/codex.js';
import {FilterType} from '../../types.js';
import {
	consumePreprocessorOperator,
	consumePreprocessorValue,
} from './consumers.js';
import {
	PreprocessorParserError,
	preprocessorParserErrorKinds,
} from './errors.js';

export type Preprocessor = {
	type: FilterType.Preprocessor;
	expression: string;
};

export function parsePreprocessor(line: string): Preprocessor {
	if (line.charCodeAt(0) !== ascii.exclamation || line.charCodeAt(1) !== ascii.numero) {
		throw new PreprocessorParserError(
			preprocessorParserErrorKinds.invalidSignature,
			'The preprocessor header is not valid!',
		);
	}

	let expression = '';

	for (let i = 2; i < line.length; i++) {
		if (line.charCodeAt(i) !== ascii.space) {
			expression += line.charAt(i);
		}
	}

	return {
		type: FilterType.Preprocessor,
		expression,
	};
}

export enum Component {
	True = 0,
	False = 1,
	And = 2,
	Or = 3,
	ParenthesisOpen = 4,
	ParenthesisClose = 5,
}

export function evaluatePreprocessor(line: string, env: Set<string>) {
	const end = line.length;

	const outputs: Component[] = [];
	const stack: Component[] = [];

	let pos: number;
	let value: string;
	let opcode: Component;

	for (pos = 0; pos < end;) {
		try {
			[pos, opcode] = consumePreprocessorOperator(line, pos);

			if (opcode === Component.ParenthesisClose) {
				let hasSeenParenthesisOpen = false;

				while (stack.length) {
					opcode = stack.pop()!;

					// eslint-disable-next-line max-depth
					if (opcode === Component.ParenthesisOpen) {
						hasSeenParenthesisOpen = true;

						break;
					} else {
						outputs.push(opcode);
					}
				}

				if (!hasSeenParenthesisOpen) {
					throw new PreprocessorParserError(
						preprocessorParserErrorKinds.invalidOperator,
						'There is a mismatched parenthesis!',
					);
				}
			} else {
				stack.push(opcode);
			}
		} catch (_error) {
			[pos, value] = consumePreprocessorValue(line, pos, end);

			if (env.has(value)) {
				outputs.push(Component.True);
			} else {
				outputs.push(Component.False);
			}
		}
	}

	while (stack.length) {
		opcode = stack.pop()!;

		if (
			opcode === Component.ParenthesisOpen
			|| opcode === Component.ParenthesisClose
		) {
			throw new PreprocessorParserError(
				preprocessorParserErrorKinds.invalidOperator,
				'There is a mismatched parenthesis!',
			);
		}

		outputs.push(opcode);
	}

	for (pos = 0; pos < outputs.length; pos++) {
		if (outputs[pos] < Component.And) {
			stack.push(outputs[pos]);
		}

		if (outputs[pos] === Component.And) {
			if (stack.pop()! + stack.pop()! === 2) {
				stack.push(Component.True);
			} else {
				stack.push(Component.False);
			}
		} else if (outputs[pos] === Component.Or) {
			if (stack.pop()! + stack.pop()! > 0) {
				stack.push(Component.True);
			} else {
				stack.push(Component.False);
			}
		}
	}

	return stack[0] === Component.True;
}
