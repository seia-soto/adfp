import test from 'ava';
import {parseNetworkFilter} from '../src/index.js';

test('hostname', t => {
	t.is(parseNetworkFilter('domain.tld').hostname, 'domain.tld');
});

test('url', t => {
	const a = parseNetworkFilter('domain.tld/pathname');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, '/pathname');
	t.is(a.isEffectiveTld, true);
});

test('url parameter', t => {
	const a = parseNetworkFilter('domain.tld/pathname?param0=value0&param1=value1');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, '/pathname?param0=value0&param1=value1');
	t.is(a.isEffectiveTld, true);
});

test('full url', t => {
	const a = parseNetworkFilter('http://domain.tld/pathname?param0=value0');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, 'http://domain.tld/pathname?param0=value0');
	t.is(a.isEffectiveTld, false);

	const b = parseNetworkFilter('http://domain.tld');

	t.is(b.hostname, 'domain.tld');
	t.is(b.pattern, 'http://domain.tld');
	t.is(b.isEffectiveTld, false);
});

test('header', t => {
	const a = parseNetworkFilter('|domain.tld');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, '');
	t.is(a.isEffectiveTld, false);
	t.is(a.isFullUrlMatchedByPatternFromForward, true);

	const b = parseNetworkFilter('||domain.tld');

	t.is(b.hostname, 'domain.tld');
	t.is(b.pattern, '');
	t.is(b.isEffectiveTld, true);
	t.is(b.isFullUrlMatchedByPatternFromForward, false);

	const c = parseNetworkFilter('^domain.tld');

	t.is(c.hostname, 'domain.tld');
	t.is(c.pattern, '');
	t.is(c.isEffectiveTld, false);
	t.is(c.isSeparatorTokenMatchedByPatternFromForward, true);

	const d = parseNetworkFilter('|^domain.tld');

	t.is(d.hostname, 'domain.tld');
	t.is(d.pattern, '');
	t.is(d.isEffectiveTld, false);
	// Heuristic fix (recognise as ^domain.tld)
	t.is(d.isFullUrlMatchedByPatternFromForward, false);
	t.is(d.isSeparatorTokenMatchedByPatternFromForward, true);

	const e = parseNetworkFilter('||^domain.tld');

	t.is(e.hostname, 'domain.tld');
	t.is(e.pattern, '');
	t.is(e.isEffectiveTld, false);
	// Heuristic fix (recognise as ^domain.tld)
	t.is(e.isFullUrlMatchedByPatternFromForward, false);
	t.is(e.isSeparatorTokenMatchedByPatternFromForward, true);
});

test('regexp', t => {
	const a = parseNetworkFilter('/test/');

	t.is(a.hostname, '');
	t.is(a.pattern, '/test/');
	t.is(a.isRegexp, true);

	const b = parseNetworkFilter('^/test/');

	t.is(b.hostname, '');
	t.is(b.pattern, '/test/');
	t.is(b.isRegexp, false);
	t.is(b.isSeparatorTokenMatchedByPatternFromForward, true);

	const c = parseNetworkFilter('/^[test]{4}$/');

	t.is(c.pattern, '/^[test]{4}$/');
	t.is(c.isRegexp, true);

	const d = parseNetworkFilter('/te$st/');

	t.is(d.hostname, '');
	t.is(d.pattern, '/te$st/');
});

test('options', t => {
	const a = parseNetworkFilter('||domain.tld$key');

	t.is(a.hostname, 'domain.tld');
	t.is(a.pattern, '');
	t.deepEqual(a.options, [['key', undefined]]);

	// Find the actual index of the options start
	const b = parseNetworkFilter('||domain.tld/$pathname$key');

	t.is(b.hostname, 'domain.tld');
	t.is(b.pattern, '/$pathname');
	t.deepEqual(b.options, [['key', undefined]]);

	const c = parseNetworkFilter('||domain.tld$key=value');

	t.deepEqual(c.options, [['key', 'value']]);

	const d = parseNetworkFilter('||domain.tld$key=value,_');

	t.deepEqual(d.options, [['key', 'value']]);

	const e = parseNetworkFilter('||domain.tld$key=value,__');

	t.deepEqual(e.options, [['key', 'value']]);

	const f = parseNetworkFilter('||domain.tld$key=\\$value');

	t.deepEqual(f.options, [['key', '$value']]);

	const g = parseNetworkFilter('||domain.tld$key=\\\\value');

	t.deepEqual(g.options, [['key', '\\value']]);

	const h = parseNetworkFilter('||domain.tld$key0,key1=value1,_,key2=value2');

	t.deepEqual(h.options, [
		['key0', undefined],
		['key1', 'value1'],
		['key2', 'value2'],
	]);

	const i = parseNetworkFilter('/te$t/$key0,key1=value1\\$');

	t.is(i.isRegexp, true);
	t.deepEqual(i.options, [
		['key0', undefined],
		['key1', 'value1$'],
	]);
});

test('glob pattern', t => {
	const a = parseNetworkFilter('domain*.tld');

	t.is(a.hostname, '');
	t.is(a.pattern, 'domain*.tld');
});
