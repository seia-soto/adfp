import {parseNetworkFilter} from './network/index.js';

export function parseFilter(line: string) {
	return parseNetworkFilter(line);
}
