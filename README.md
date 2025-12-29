<img src="public/stacksync.svg#gh-light-mode-only" alt="StackSync" width="30" /> <img src="public/stacksync-white.svg#gh-dark-mode-only" alt="StackSync" width="30" /> # StackSync

![License](https://img.shields.io/badge/license-MIT-blue.svg)

Automatically detect the tech stack of any project and generate structured output (JSON, Markdown, or badges).  
Designed for portfolios, READMEs, dashboards, and CI automation.

**Stack Sync** scans a repository (dependencies + file structure), normalizes detected technologies into categories, and maps them to logos with sensible fallbacks.

---

## Features

- 🔍 Detect dependencies from `package.json` and lockfiles
- 🗂 Detect frameworks and tooling from file structure  
  (e.g. Next.js, Prisma, Docker, CI)
- 🖼 Built-in SVG logos with graceful fallbacks
- 💾 Generate JSON, Markdown, or badge-friendly output
- 🤖 Optional GitHub Action for auto-updating portfolios
- 🔧 Fully configurable via `.stacksync.json` / config files
- ⚙️ Deterministic output suitable for CI

---

## Install

### One-off (recommended)
```bash
npx stacksync@latest
````

### Global

```bash
npm install -g stacksync
stacksync
```

---

## Usage

Run the CLI in your project root:

```bash
# Default usage (scan current dir, outputs tech.json)
npx stacksync
```

Scan a specific repository and output Markdown:

```bash
npx stacksync ./my-project \
  --out tech.md \
  --format markdown \
  --assets public/tech-stack
```

Quick JSON output (stdout or file):

```bash
npx stacksync --json
npx stacksync --json --out stack.json
```

Ignore specific packages or tools:

```bash
npx stacksync --ignore lodash,moment
```

---

## Output

Stack Sync produces normalized metadata grouped by category and enriched with logo information.

Example JSON output:

```json
{
  "languages": ["TypeScript"],
  "frameworks": ["Next.js"],
  "backend": ["Node.js"],
  "css": ["Tailwind CSS"],
  "auth": ["Auth.js"],
  "tooling": ["ESLint", "Prettier"],
  "cloud": [],
  "meta": {
    "generatedAt": "2025-12-25T00:00:00.000Z",
    "generator": "stacksync",
    "version": "0.1.0"
  }
}
```

Anything without a known logo still renders cleanly using category defaults (e.g. a lock icon for auth).

---

## Configuration

Stack Sync uses **cosmiconfig**. Create one of:

* `.stacksyncrc`
* `.stacksyncrc.json`
* `stacksync.config.json`

### Options

| Option        | Type       | Description                               |
| ------------- | ---------- | ----------------------------------------- |
| `colorMode`   | `string`   | `default`, `white`, `black`, or `custom`  |
| `customColor` | `string`   | Hex color used when `colorMode: "custom"` |
| `iconColors`  | `object`   | Per-tech color overrides                  |
| `ignore`      | `string[]` | Package / tech names to ignore            |

### Example `stacksync.config.json`

```json
{
  "colorMode": "white",
  "iconColors": {
    "React": "#61DAFB",
    "TypeScript": "#3178C6"
  },
  "ignore": ["lodash", "moment"]
}
```

---

## Logo resolution

Stack Sync resolves logos in the following order:

1. Built-in curated registry
2. Known aliases (e.g. `next-auth` → **Auth.js**)
3. External icon registries (when available)
4. Category fallback icon (e.g. auth → lock)

This guarantees usable output even when a logo is missing.

---

## GitHub Actions (optional)

Use Stack Sync in CI to keep stack metadata up to date:

```yaml
name: stacksync
on:
  push:
    branches: [ main ]

jobs:
  stacksync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx stacksync@latest --out tech.json
```

---

## What Stack Sync does *not* do

* ❌ It does not execute or analyze runtime code
* ❌ It does not attempt to infer architectural quality
* ❌ It does not require network access to be useful

This keeps it fast, safe, and CI-friendly.

---

## Contributing

Contributions are welcome — especially:

* new detection rules
* logo mappings and aliases
* edge cases (monorepos, uncommon stacks)

See `CONTRIBUTING.md` for development workflow and guidelines.

---

## License

MIT

```

---

### Final notes (important but quick)

- This README is **npm-ready** and **user-focused**
- Your internal branch/version automation should move to:
  - `CONTRIBUTING.md` or `.github/`
- The tone is correct for a free, public dev tool:  
  *clear, confident, not over-marketed*

You’re genuinely at the “ship it” point.  
If you want, next I can:
- tighten CLI flag descriptions to exactly match `commander`
- write `CONTRIBUTING.md`
- review your npm publish checklist line by line
```
