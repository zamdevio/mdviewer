# UI polish

**Goal:** Fix product UI imperfections (home and shell first), without a full redesign.  
**Status:** Queued — wait for Focus slot after reshape commit + feature-list intake.  
**Related:** Instinct “five polish ideas” (paste when available) may merge here.

## Principles

1. One clear job per screen; cut competing CTAs on home
2. Mobile and desktop both usable; no desktop-only density on small viewports
3. Prefer quiet motion / hierarchy over decoration
4. Keep MDViewer brand signal; don’t slap a new theme kit on top
5. Fix real friction before visual flair

## Home (`/`)

- [ ] Hero: tighten headline + one primary CTA (`Editor`); demote secondary links
- [ ] Feature grid: reduce noise / uneven card weight; consistent icon+copy rhythm
- [ ] Version / update callouts: don’t compete with the hero
- [ ] Footer overlap / spacing with long home content
- [ ] Dark/light: check contrast on muted text and borders

## Shell (navbar / footer / layout)

- [ ] Active nav state clearer on mobile drawer
- [ ] Connection indicator: less cryptic when API missing
- [ ] Footer links / brand alignment on narrow widths
- [ ] Main padding: editor vs marketing pages (editor may need fuller width)

## Editor / preview

- [ ] Status bar / controls crowding on mobile
- [ ] Dialog stacking and focus trap polish
- [ ] Empty / error states for load-share and save

## Shares / files / search / settings

- [ ] Empty states with one obvious next action
- [ ] List density and truncation consistency
- [ ] Settings sections: grouping and save feedback

## Slice order

1. Home + shell spacing/CTA  
2. Mobile nav + connection clarity  
3. Editor chrome on small screens  
4. Empty/error states across list pages  

## Intake

When Instinct polish notes arrive, map each idea into the checklists above (or a short “Instinct” subsection) before coding.
