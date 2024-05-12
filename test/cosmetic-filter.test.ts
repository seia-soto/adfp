import test from 'ava';
import {parseCosmeticFilter} from '../src/parser/filter/cosmetic/index.js';

test('hostname', t => {
	const a = parseCosmeticFilter('domain.tld##div');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, 'div');

	const b = parseCosmeticFilter('domain.tld#@#div');

	t.is(b.isException, true);

	const c = parseCosmeticFilter('##div');

	t.is(c.hostname, '');
	t.is(c.pattern, 'div');
});
