/* palettes.js — the 8 design palettes (shared design tokens).
 * Mirrors the `P` map that used to live in src/data.js. The store keeps only a
 * `palette_key`; the generated-cover fallback resolves it to colours here. */
export const PALETTES = {
  ink:   { bg: '#0E2A2E', bg2: '#163A3D', fg: '#E7C77E', accent: '#C99A3B' },
  jade:  { bg: '#13433A', bg2: '#1C5A4B', fg: '#EAD9A6', accent: '#2E8B6B' },
  plum:  { bg: '#2A1C2E', bg2: '#3C2A40', fg: '#E7C77E', accent: '#C99A3B' },
  rust:  { bg: '#3A2018', bg2: '#4E2A1E', fg: '#EBC99A', accent: '#D9694B' },
  navy:  { bg: '#10243A', bg2: '#16314E', fg: '#E7C77E', accent: '#C99A3B' },
  olive: { bg: '#2A2E18', bg2: '#3A3E22', fg: '#E7C77E', accent: '#C99A3B' },
  wine:  { bg: '#34161C', bg2: '#481E26', fg: '#E7C77E', accent: '#C99A3B' },
  teal:  { bg: '#08302E', bg2: '#0F423E', fg: '#E7C77E', accent: '#2E8B6B' },
};
export const PALETTE_KEYS = Object.keys(PALETTES);
export const paletteOf = (key) => PALETTES[key] || PALETTES.ink;
