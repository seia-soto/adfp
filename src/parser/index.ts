import {ascii} from '../utils/codex.js';
import {parseExtension} from './extensions/index.js';
import {parseNetworkFilter} from './filters/network/index.js';

export function parse(line: string) {
	if (line.charCodeAt(0) === ascii.exclamation) {
		return parseExtension(line);
	}

	return parseNetworkFilter(line);
}
