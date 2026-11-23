# Architecture

The cockpit ships as ONE self-contained file, `dist/index.html`, so it can be opened by double-click
(no server, no dependencies). The source is split into small partials under `src/` and assembled by
`tools/build.mjs`.

```
src/manifest.json     load order of every partial (the single source of truth)
src/html/head.html    <head> up to <title>
src/css/NN-name.css   stylesheet partials, concatenated into one <style>
src/html/NN-name.html body partials, concatenated in order
src/html/slots/*.html partials injected at <!--slot:NAME--> markers (see manifest.slots)
src/js/NN-name.js     JS modules, concatenated into ONE shared closure, in manifest order
tools/build.mjs       node tools/build.mjs   -> dist/index.html
tools/smoke.mjs       node tools/smoke.mjs   -> headless browser check of the built file
legacy/               the original single-file versions, untouched
```

## Rules every module follows

1. **One closure.** All JS modules share one function scope: a `const`/`let`/`function` declared at
   the top level of a module is visible to every later module, and function declarations are visible
   to all modules. Do not add `import`/`export`, IIFEs around a whole module, or globals on `window`.
   Top-level names must be unique across modules.
2. **Load order = manifest order.** Code that runs at load time may only use `const`/`let` names from
   earlier modules. `99-boot.js` stays last: it restores saved state and does the first render.
3. **Refresh bus** (`js/01b-bus.js`). The core calls `touch()` at the end of `render(week)` and
   `setLang()`. A feature module registers `onRefresh(fn)` and re-renders itself there; that one hook
   covers week, language, currency, theme and data changes. If a module changes state outside the
   core render paths, it calls `touch()` itself.
4. **Text.** Every user-visible string exists in English and Portuguese: `T(en, pt)`, `L([en, pt])`,
   or `data-i18n="key"` with the key added by `Object.assign(I18N, { "key": [en, pt] })` in the module
   that owns it (the base dictionary lives in `02-i18n-currency.js`).
5. **Money.** Values are stored in BRL million. Display only through `money()`, `moneyD()`, `bn()`,
   `sym()`, `ccyCode()`, `fx()`; never hard-code "R$".
6. **Safety.** Dynamic text goes through `esc()` before `innerHTML`. No external scripts, no network
   calls except the optional, user-configured AI endpoint.
7. **Theme.** CSS uses the custom properties from `00-tokens-base.css`; a feature partial carries its
   own `html[data-theme=dark]` rules. Feature partials are numbered 50-79 and load before
   `90-dark.css`, `91-print.css`, `92-responsive.css`.
8. **DOM lookups.** `$("id")` returns null when the partial is missing; code that binds events at load
   time guards for it, so a missing partial can never abort the whole closure.
9. **Honesty.** Example data stays labelled as example data, fabricated market figures stay labelled
   as fabricated, and nothing presents itself as real bank data. No official bank logos.
