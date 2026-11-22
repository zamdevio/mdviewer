# UI polish

**Goal:** Fix product UI imperfections (home and shell first), without a full redesign.  
**Status:** Slices 1–4 shipped (home/shell, editor chrome, empty states, settings).  
**Related:** Instinct “five polish ideas” (paste when available) may merge here.

## Principles

1. One clear job per screen; cut competing CTAs on home
2. Mobile and desktop both usable; no desktop-only density on small viewports
3. Prefer quiet motion / hierarchy over decoration
4. Keep MDViewer brand signal; don’t slap a new theme kit on top
5. Fix real friction before visual flair

## Home (`/`)

- [x] Hero: tighten headline + one primary CTA (`Editor`); demote secondary links
- [x] Feature grid: reduce noise / uneven card weight; consistent icon+copy rhythm
- [x] Version / update callouts: don’t compete with the hero
- [x] Footer overlap / spacing with long home content
- [x] Dark/light: check contrast on muted text and borders

## Shell (navbar / footer / layout)

- [x] Active nav state clearer on mobile drawer
- [x] Connection indicator: less cryptic when API missing
- [x] Footer links / brand alignment on narrow widths
- [x] Main padding: editor vs marketing pages (editor may need fuller width)

## Editor / preview

- [x] Status bar / controls crowding on mobile
- [ ] Dialog stacking and focus trap polish
- [ ] Empty / error states for load-share and save

## Shares / files / search / settings

- [x] Empty states with one obvious next action
- [ ] List density and truncation consistency
- [x] Settings sections: grouping and save feedback

## Slice order

1. Home + shell spacing/CTA — done  
2. Mobile nav + connection clarity — done  
3. Editor chrome on small screens — done  
4. Empty/error states across list pages + settings feedback — done  

## Intake

When Instinct polish notes arrive, map each idea into the checklists above (or a short “Instinct” subsection) before coding.
