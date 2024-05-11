import {ascii} from '../../../utils/codex.js';
import {lastIndexOfUnescapedCharacter} from '../../../utils/strings.js';

export function indexOfOptions(line: string, end: number, isRegexpPatternCandidate: boolean) {
	if (isRegexpPatternCandidate) {
		if (line.charCodeAt(end - 1) === ascii.slash) {
			return -1;
		}
	}

	return lastIndexOfUnescapedCharacter(line, ascii.dollar, 0, end);
}
