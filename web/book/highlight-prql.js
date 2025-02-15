// Syntax highlighting for PRQL.

// Keep consistent with
// https://github.com/PRQL/prql/blob/main/web/website/themes/prql-theme/static/highlight/prql.js
// TODO: can we import one from the other at build time?

// Inspired by [Pest's book](https://github.com/pest-parser/book)

// mdBook exposes a minified version of highlight.js, so the language
// definition objects below have abbreviated property names:
//     "b"  => begin
//     "e"  => end
//     "c"  => contains
//     "k"  => keywords
//     "cN" => className

// TODO:
// - Can we represent strings with the actual rule of >= 3 quotes?
// - Aliases seem a bit strong?
// - Can we represent the inner s & f string items?

formatting = function (hljs) {
  const TRANSFORMS = [
    "aggregate",
    "append",
    "derive",
    "filter",
    "from_text",
    "from",
    "group",
    "join",
    "select",
    "sort",
    "take",
    "union",
    "window",
  ];
  const BUILTIN_FUNCTIONS = ["case", "in", "as"];
  const KEYWORDS = ["let", "prql", "into"];
  return {
    name: "PRQL",
    case_insensitive: true,
    keywords: {
      keyword: [...TRANSFORMS, ...BUILTIN_FUNCTIONS, ...KEYWORDS],
      literal: "false true null ",
    },
    contains: [
      hljs.COMMENT("#", "$"),
      {
        // named arg
        scope: "params",
        begin: /\w+\s*:/,
        end: "",
        relevance: 10,
      },
      // This seems much too strong at the moment, so disabling. I think ideally
      // we'd have it for aliases but not assigns.
      // {
      //   // assign
      //   scope: { 1: "variable" },
      //   match: [/\w+\s*/, /=[^=]/],
      //   relevance: 10,
      // },
      {
        // date
        scope: "string",
        match: /@(\d*|-|\.\d|:)+/,
        relevance: 10,
      },
      {
        // interval
        scope: "string",
        // Add more as needed
        match: /\d+(days|hours|minutes|seconds|milliseconds)/,
        relevance: 10,
      },
      {
        // interpolation strings: s-strings are variables and f-strings are
        // strings? (Though possibly that's too cute, open to adjusting)
        //
        scope: "variable",
        relevance: 10,
        variants: [
          {
            begin: '(s)"""',
            end: '"""',
          },
          {
            begin: '(s)"',
            end: '"',
          },
        ],
        contains: [
          // I tried having the `f` / `s` be marked differently, but I don't
          // think it's possible to have a subscope within the begin / end.
          {
            // I think `variable` is the right scope rather than defaulting to
            // white, but not 100% sure; using `subst` is suggested in the docs.
            scope: "variable",
            begin: /\{/,
            end: /\}/,
          },
        ],
      },
      {
        scope: "string",
        relevance: 10,
        variants: [
          {
            begin: '(f)"""',
            end: '"""',
          },
          {
            begin: '(f)"',
            end: '"',
          },
        ],
        contains: [
          {
            scope: "variable",
            begin: "f",
            end: '"',
            // excludesEnd: true,
          },
          // TODO: would be nice to have this be a different color, but I don't
          // think it's possible to have a subscope within the begin / end.
          // {
          //   scope: "punctuation",
          //   match: /{|}/,
          // },
          {
            scope: "variable",
            begin: /\{/,
            end: /\}/,
          },
        ],
      },
      {
        // normal string
        scope: "string",
        relevance: 10,
        variants: [
          // TODO: is there a way of encoding the actual rule here? Otherwise
          // we're just adding the variants we use...
          {
            begin: '"""""',
            end: '"""""',
          },
          {
            begin: '"""',
            end: '"""',
          },
          {
            begin: '"',
            end: '"',
          },
          {
            begin: "'",
            end: "'",
          },
        ],
      },
      { scope: "punctuation", match: /[\[\]{}(),]/ },
      {
        scope: "operator",
        match:
          /(>)|(<)|(==)|(\+)|(\-)|(\/)|(\*)|(!=)|(->)|(=>)|(<=)|(>=)|(&&)|(\|\|)/,
        relevance: 10,
      },
      {
        scope: "number",
        // Regex explanation:
        // 1. `\b`: asserts a word boundary. This ensures that the pattern matches numbers that are distinct words or at the boundaries of words.
        // 2. `(\d[_\d]*(e|E)\d[_\d]*)`: This is the first alternative in the main group and matches numbers in scientific notation:
        //     - `\d`: matches a digit (0-9).
        //     - `[_\d]*`: matches zero or more underscores or digits, representing the numbers before the `e` in scientific notation.
        //     - `e`: matches the letter 'e' for scientific notation.
        //     - `\d`: matches a digit (0-9), the beginning of the exponent.
        //     - `[_\d]*`: matches zero or more underscores or digits, representing the numbers after the `e` in scientific notation.
        // 3. `(\d[_\d]*\.?[\d_]*\d)`: This is the second alternative in the main group and matches standard numbers without the scientific notation:
        //     - `\d`: matches a digit (0-9), representing the first digit of the number.
        //     - `[_\d]*`: matches zero or more underscores or digits, for the sequence before a potential decimal point.
        //     - `\.?`: matches an optional decimal point.
        //     - `[\d_]*`: matches zero or more digits or underscores, representing the sequence after the decimal point if it exists.
        //     - `\d`: ensures the sequence ends in a digit, so there's no trailing underscore.
        // 4. `(\.[\d_]+)`: This is the third alternative in the main group:
        //     - `\.`: matches a literal dot, so this alternative captures numbers that begin with a decimal point.
        //     - `[\d_]+`: matches one or more digits or underscores, for the sequence after the initial dot.
        match: /\b((\d[_\d]*(e|E)\d[_\d]*)|(\d[_\d]*\.?[\d_]*\d)|(\.[\d_]+))/,
        relevance: 10,
      },
      {
        // range
        scope: "symbol",
        match: /\.{2}/,
        relevance: 10,
      },
      // Unfortunately this just overrides any keywords. It's also not
      // complete — it only handles functions at the beginning of a line.
      // I spent several hours trying to get hljs to handle this, but
      // because there's no recursion, I'm not sure it's possible.
      // Possibly we could hook into `on:begin` and implement it
      // ourselves, but this would be a lot of overhead.
      // { // function
      //     keywords: TRANSFORMS.join(' '),
      //     beginScope: { 1: 'title.function' },
      //     begin: [/^\s*[a-zA-Z]+/, /(\s+[a-zA-Z]+)+/],
      //     relevance: 10
      // },
    ],
  };
};

hljs.registerLanguage("prql", formatting);

// These lines should only exists in the book, not the website.

// This file is unfortunately inserted after the default highlight.js
// invocation, which tags unknown-language blocks with CSS classes but doesn't
// highlight them.
Array.from(document.querySelectorAll("code.language-prql")).forEach((a) =>
  hljs.highlightElement(a),
);
