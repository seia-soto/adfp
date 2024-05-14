import test from 'ava';
import {evaluatePreprocessor} from '../src/parser/extensions/preprocessor/index.js';

test('true', t => {
	const env = new Set(['true']);

	t.true(evaluatePreprocessor('true', env));
	t.true(evaluatePreprocessor('true||false', env));
	t.true(evaluatePreprocessor('true||(false&&true)', env));
});

test('false', t => {
	const env = new Set(['true']);

	t.false(evaluatePreprocessor('false', env));
	t.false(evaluatePreprocessor('false&&true', env));
	t.false(evaluatePreprocessor('false&&true||false', env)); // Invalid expression
});
