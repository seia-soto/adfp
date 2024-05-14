import {parsePreprocessor} from './preprocessor/index.js';

export function parseExtension(line: string) {
	return parsePreprocessor(line);
}
