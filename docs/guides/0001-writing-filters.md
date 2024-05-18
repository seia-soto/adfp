# Writing filters

In the current ecosystem of ad-blocking, request-filtering, or any kind of filtering-capable system.
There're plenty of syntax that we can use to express the rule or filter.

In this document, we try to make a straightforward and clean guide of how-to write filters and try to explain you what are the differences per implementation: AdBlockPlus (ABP), uBlock Origin (uBO), and AdGuard (AG).

In general, you can expect the base syntax of ABP and uBO are same, and AG is a bit different from them.
However, this doesn't mean that ABP and uBO share the implementation and syntax details.

I hope you understand the reason why this document exists at the moment by reading the introduction.

Also, see:
- ABP filter documentation: https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters
- uBO filter documentation: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax
- AG filter documentation: https://adguard.com/kb/general/ad-filtering/create-own-filters/

---

In `adfp`, we consider there are three components: network filter, cosmetic filter, and extensions.

At the moment, we only support parsing network filters.
Therefore, the documentation regarding cosmetic filter will be available after the implementations.

- Network Filters: interacts with the network requests.
- Cosmetic Filters: interacts with the DOM.
- Extensions: these are not filters but extends the filter list capability by extending comments. (e.g. preprocessors)

Before starting, note that comments always starts with `!`.

## Network filters

Network filters are known to interact with the network activities or requests.

Depending on the leading signatures, we have a few of expectations on the format of the filter:

```
[|][^]<token>[^][|]
<||effective-tld>[uri][^][|]
</regexp/>
```

These filters can include options by specifying the dollar (`$`) symbol:

```
<filter>[$<key>[=value][...,<key>[=value]]]
```

Also, these filters can be marked as an exception by prepending consecutive double ats (`@`):

```
[@@]<filter>
```

- Square brackets mean that the component is optional.
- Angle brackets mean that the component is required.
- Consecutive dots mean that the component can be repeated.

### The header

The header have three kinds of markers: hat `^`, pipe `|`, and consecutive double pipes `||`.

The order of these signatures should be consistent: pipe always comes first, then followed by hat.

**pipe (`|`), the full url matcher**

This marker means that the filter should match the urls starting with followed pattern string.
Note that the request urls are in full url schema from the most of ad-blockers or request-blockers.

Therefore, we should expect full url schema after the pipe to make the filter sense.
For example, `|pattern` is not valid at all because it doesn't start with the protocol.
Instead, we'd write like `|http://domain.tld` or `|https://domain.tld`.

**hat (`^`), the separator token matcher**

This marker means that the separator tokens (see below) should match the urls starting with followed pattern string.

The concept of the separator token in ad-blocking or request-filtering ecosystem is really important.
This kind of filters can be often seen.

The separator token is a set of url component strings by following the ABP filter documentation.
They're outcome of splitted url by the separator tokens:

```
protocol "://" domain.tld ":" 80 "/" pathname "?" key "=" value [..."&" key "=" value]
```

- The separator characters are covered with double quotes and spaces.
- Consecutive dots with sqaure brackets mean that the component can be repeated.

Also, the end of url can be a separator token.
This means that we'll see the full pathname as a separator token.

**double consecutive pipes (`||`), effective TLD marker**

This marker means that the followed pattern string is starting with effective TLD with all supported common protocols.

This marker is often used with the trailing hat symbol which matches the end of separator token.
However, it doesn't make sense since the only expected string is only effective TLD if we see this concept strictly.

```
||domain.tld^
```

Therefore, we want to add some comments to this marker.

- If we see this marker, the followed string must be a form of effective TLD: `||eTLD`
- If we see this marker with leading hat sign, it doesn't make sense since the concept of effective TLD conflicts: `||^eTLD` (invalid, converted to `^eTLD`)
- If we see this marker with trailing hat sign, the followed string still must be a form of effective TLD (trailing hat has same effect eventually): `||eTLD^` (converted to `||eTLD`)
- If we see this marker with trailing pipe sign, it doesn't make sense without uri part: `||eTLD/pathname|`
- If we see additinal uri after the expected effective TLD, we want to accept them by default: `||eTLD/pathname`

**double consecutive ats (`@@`), exception marker**

This marker means that the followed filter should be disabled.

The behavior can be affected by other modifiers such as `importand` and `badfilter`, and the final action can be different by implementation details.

### The footer

Reference the header section for the details.

**pipe (`|`), the full url matcher**

This marker means that the filter should match the urls emding with led pattern string.

**hat (`^`), the separator token matcher**

This marker means that the separator tokens (see below) should match the urls starting with led pattern string.

### The options

The filter options are the pairs of key-value strings expressed in comma-spread format paired with equal sign after the `$` symbol.

```
<filter>[$<key>[=value][...,<key>[=value]]]
```

The key can only contain alphabet, numeric, and underscore character.

- If the key only contains underscore, the value is not expected and the key will be ignored: `$___`
- If we see comma sign after the key, we won't expect value for this key.
- If we see equal sign after the key, we will expect value for this key.

The value will terminated if there's comma.
However, the value can contain any type of character because it can contain escaping character: `\,`

Often, we do call these as `modifiers`.
