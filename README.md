# D&D 5E character sheet (iPad 4 build)

**This is a frozen snapshot of [dnd-char-sheet](https://github.com/glpste/dnd-char-sheet) built to run on an iPad 4 (iOS 10.3, Safari 10.1).** It ships an ES5 bundle with polyfills and avoids CSS that Safari 10 cannot parse; `npm run check:legacy` guards the build output. New features land in the main repo, not here. Move a character over with **Export / import → Paste JSON…**.

Live: <https://glpste.github.io/dnd-char-sheet-ipad/>

A single-page character sheet for D&D 5th edition, built for a desktop or landscape screen at the table. It reproduces page 1 of the official fillable PDF (in `res/`), auto-calculates everything the rules let it, and adds:

- a **weapons** section with per-weapon attack and damage bonuses, special effects and notes;
- a free-form **spellbook** with spell slots, prepared toggles, search and a long-rest reset;
- a built-in **cheat sheet** of core 2014-rules mechanics (SRD 5.1) plus personal notes per character;
- several characters per browser, with JSON export and import.

Main app: <https://glpste.github.io/dnd-char-sheet/>

## Your data stays in your browser

Everything is stored in `localStorage` on the device you use. There is no account and no server. Use **Export / import** in the header to back up a character or move it to another device. Clearing site data for the page deletes your characters.

## Keyboard

`1` Sheet · `2` Spellbook · `3` Cheat sheet (when no field is focused). Number fields accept arrow keys; hold Shift for steps of 5.

## Development

```bash
npm install
npm run dev
```

```bash
npm test
```

```bash
npm run typecheck
```

`npm run build` produces `dist/`. The GitHub Actions workflow in `.github/workflows/deploy.yml` builds with `VITE_BASE=/dnd-char-sheet/` and publishes to GitHub Pages on every push to `main`.

Design notes live in `docs/superpowers/specs/`, the implementation plan in `docs/superpowers/plans/`.

## Attribution

Rules on the cheat sheet are summarised from the Systems Reference Document 5.1 by Wizards of the Coast, licensed under the Creative Commons Attribution 4.0 International License (CC-BY-4.0). Dungeons & Dragons is a trademark of Wizards of the Coast; this project is not affiliated with or endorsed by them.
