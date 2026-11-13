# NPCwebomania

The NPC Automators website, with a restrained green palette, monochrome
Dither Field waves on the homepage, and responsive layouts.

## Run locally

Requirements: Node.js 22.6 or newer and npm. Python 3 is needed only for
regenerating the prepared website and verifying its assets.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Production

```sh
npm run build
npm start
```

The site uses a Node.js server, including same-origin contact and newsletter
form endpoints. Form submissions are stored in the local `data/` directory;
provide persistent writable storage there when deploying.

## Source and assets

- `src/site/pages/`: prepared HTML documents served by the Next.js route handler.
- `src/site/npc-theme.css`: palette and responsive adjustments.
- `src/site/npc-dither-field.js`: animated homepage waves.
- `src/site/npc-scroll-velocity.js`: animated footer lettering.
- `scripts/npc_branding.py`: matching customization of HTML and its React graph.
- `public/`: local fonts, images, videos, and prepared JavaScript modules.
- `reference/`: source material used to regenerate the prepared site.

After changing the customization scripts, theme, or custom animation sources,
regenerate the prepared documents and versioned browser assets:

```sh
npm run prepare:reference
npm run verify:assets
npm run build
```

The Dither Field adaptation retains the Magic UI MIT license in its source;
the reference copy of that license is in `reference/magicui/LICENSE.md`.

## Checks

```sh
npm run typecheck
npm test
npm run verify:assets
```

Responsive inspection results are in `artifacts/green-waves/`.

## Restoring changes

Git records the published project state. Local restore archives and instructions
are documented in `BACKUP.md`. These archives, private environment files, local
form submissions, dependencies, and build caches are excluded from Git.
