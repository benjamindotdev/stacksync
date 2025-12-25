# Contributing to StackSync

We love contributions! Whether it's adding a new logo, fixing a bug, or improving documentation, your help is welcome.

## Adding a New Logo

1.  **Check if it exists**: Look in `src/techDefinitions.ts` to see if the technology is already defined.
2.  **Add the definition**: If missing, add a new entry to `src/techDefinitions.ts`.
    ```typescript
    {
      "id": "new-tech",
      "name": "New Tech",
      "aliases": ["new-tech-package"],
      "category": "framework",
      "logo": "framework/new-tech.svg"
    }
    ```
3.  **Add the SVG**: Place the SVG file in `assets/logos/<category>/<filename>.svg`.
    *   Ensure the SVG is clean and optimized.
    *   If possible, use the official brand color.

## Development

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/benjamindotdev/stacksync.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the playground**:
    ```bash
    npm run playground
    ```
    This starts a local server where you can test detection and logo rendering.

## Pull Requests

*   Keep PRs small and focused.
*   Use descriptive titles.
*   Ensure the build passes (`npm run build`).

Thank you for helping make StackSync better!
