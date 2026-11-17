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

To also receive each submission in a Telegram group, install the
`npc-telegram-notifier` binary (from its private repository) at one of the
paths the form endpoint checks: `bin/npc-telegram-notifier` inside this
project, `/opt/npc-automators/npc-telegram-notifier`, or
`../npc-telegram-notifier/target/release/npc-telegram-notifier`. The bot
token and group ID are compiled into the binary, so the site needs no
environment configuration. Never commit the binary to this repository —
`bin/` is gitignored. When no binary is installed, the endpoint falls back
to `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` environment variables if they
are set (see `.env.example`).

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
