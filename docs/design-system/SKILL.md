---
name: landline-design
description: Use this skill to generate well-branded interfaces and assets for Landline, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Brand:** Landline — an Android app that turns your phone into a "landline," silently capturing notifications so they can be reviewed later, without distraction. Warm, organic, vintage-telephony soul.
- **Tokens:** link `styles.css` (it `@import`s everything in `tokens/`). Use the CSS custom properties — `--color-primary` (moss `#5D7052`), `--color-secondary` (clay `#C18C5D`), `--color-background` (warm paper `#FDFCF8`), `--font-serif-display` (Fraunces), `--font-sans` (Nunito), the 8px spacing scale, organic radii, and green-tinted shadows.
- **Components:** compiled into `_ds_bundle.js` and exposed on `window.LandlineDesignSystem_b5634b`. In an HTML file, link `styles.css`, load React UMD + Babel, `<script src=".../_ds_bundle.js">`, then `const { Button, Card, RolodexCard, ... } = window.LandlineDesignSystem_b5634b`.
- **Icons:** Material Icons. Load the Google webfont and use `<span class="material-icons">name</span>`.
- **Logo:** `assets/landline-icon.png` (skeuomorphic rotary dial). Copy it out — don't redraw it.
- **UI kit:** `ui_kits/landline-app/` is a full interactive recreation — read it to see how screens are composed.

## House rules
- Warm off-white paper backgrounds, never pure white. Charcoal text, never pure black.
- Sentence case for everything except UPPERCASE wide-tracked eyebrow labels.
- Emoji only inside user content, never in chrome.
- Press states shrink to 0.95. Shadows are green-tinted. Cards can use asymmetric organic corners.
- Voice is calm, warm, second-person — give the user permission to disconnect.
