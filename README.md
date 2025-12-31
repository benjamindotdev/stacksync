<h1 align="center">
  <img src="public/stacksync.svg#gh-light-mode-only" alt="StackSync" width="50" />
  <img src="public/stacksync-white.svg#gh-dark-mode-only" alt="StackSync" width="50" />
  StackSync
</h1>

![License](https://img.shields.io/badge/license-MIT-blue.svg)

Automatically detect the tech stack of any project and generate structured output (JSON, Markdown, or badges).  
Designed for portfolios, READMEs, dashboards, and CI automation.

**Stack Sync** scans a repository (dependencies + file structure), normalizes detected technologies into categories, and maps them to logos with sensible fallbacks.

---

## Features

- 🔍 Detect dependencies from `package.json`
- 🖼 Built-in SVG logos with graceful fallbacks
- 💾 Generate JSON, Markdown, and asset files
- 🎨 Support for Brand, White, Black, or Custom color modes
- 🤖 Automates Portfolio / Monorepo README updates

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

1.  **Prepare Input**: 
    *   Place your project folders inside `stacksync/`.
    *   **OR** simply drop your `package.json` files directly into `stacksync/`. 
        *   If you have multiple, you can name them `package (1).json`, `package (2).json`, etc.
        *   StackSync will automatically create folders based on the project name defined in each file.
2.  **Run Sync**:

```bash
npx stacksync sync
```

### Add Command

You can also add a project from anywhere on your disk using the CLI. You can point to a `package.json` file OR a project directory:

```bash
# Point to a file
npx stacksync add ./path/to/package.json

# Point to a folder (automatically finds package.json)
npx stacksync add ../my-project
```

This will copy the `package.json` into a new folder inside `stacksync/` (e.g., `stacksync/my-project/`), handling name collisions automatically.

This will:
*   Scan all projects in `stacksync/`.
*   Generate `stack.json` and `stack.md` inside each project folder.
*   Copy logo assets to `public/assets/logos/`.
*   Update your root `README.md` with a "My Projects" section.

### Options

```bash
# Use white logos
npx stacksync sync --color white

# Use black logos
npx stacksync sync --color black

# Use brand colors (default)
npx stacksync sync --color brand
```

---

## Output

For each project in `stacksync/`, a `stack.json` is generated in the same folder.

Example `stack.json`:

```json
[
  {
    "name": "TypeScript",
    "slug": "typescript",
    "logo": "https://raw.githubusercontent.com/benjamindotdev/stacksync/main/public/assets/logos/language/typescript.svg",
    "relativePath": "public/assets/logos/language/typescript.svg",
    "color": "#3178C6"
  },
  {
    "name": "Next.js",
    "slug": "next",
    "logo": "https://raw.githubusercontent.com/benjamindotdev/stacksync/main/public/assets/logos/frameworks/nextjs.svg",
    "relativePath": "public/assets/logos/frameworks/nextjs.svg",
    "color": "#000000"
  }
]
```

Anything without a known logo still renders cleanly using category defaults (e.g. a lock icon for auth).

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
      - run: npx stacksync sync
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


<!-- STACKSYNC_START -->
## My Projects

### asozial
<p>
  <img src="public/assets/logos/auth/jsonwebtokens.svg" alt="JWT" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/frontend/nextdotjs.svg" alt="Auth.js" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/testing/jest.svg" alt="Jest" height="25" style="margin-right: 10px;" />
</p>

### portfolio
<p>
  <img src="public/assets/logos/frontend/react.svg" alt="React" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/frontend/react.svg" alt="ReactDOM" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/language/typescript.svg" alt="TypeScript" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/testing/playwright.svg" alt="Playwright" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/testing/testinglibrary.svg" alt="Testing Library" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/lint/husky.svg" alt="Husky" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/testing/jest.svg" alt="Jest" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/css/postcss.svg" alt="PostCSS" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/css/tailwindcss.svg" alt="TailwindCSS" height="25" style="margin-right: 10px;" />
  <img src="public/assets/logos/build/vite.svg" alt="Vite" height="25" style="margin-right: 10px;" />
</p>

<!-- STACKSYNC_END -->