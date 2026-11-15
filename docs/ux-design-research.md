# UX and visual design research (web PoC)

Short desk research (17 Oct 2026) into current techniques used by web and media designers, and how each one is applied in the Business Twin web app. The visual language itself comes from the Figma Make prototype (Business Twin Prototype Development) and the Business Twin logo.

Several sources are practitioner or agency blogs with a commercial interest. They are used for current practice, not as evidence of effect; claims marked *(verify)* were taken from search summaries and should be checked against the original before they go into a project document.

## Techniques and where they are applied

| Technique | What the sources say | Applied in Business Twin |
|---|---|---|
| Outcome-led hero with a real product visual | Lead with the visitor's problem and the benefit, not the product category, and show the product so the value is clear within seconds (Rovner, 2026; Veza Digital, n.d.) | Hero headline "Before you decide, see what might happen", plus a product card with **real engine output** for a labelled sample salon |
| Conventional section order | Hero → proof → problem/solution → how it works → features → FAQ → final call to action (Rovner, 2026) | Landing page follows this order. Pricing is left out because none exists yet |
| Honest proof instead of invented social proof | Proof near the top raises trust (Rovner, 2026) | No fake testimonials or logos (none exist). Instead: cited sector facts, the design-challenge story, and trust items (EU hosting, minimal data, delete any time, estimates not advice) |
| Bento grid for features | A mid-2020s pattern: CSS Grid tiles of different sizes, with the most important item largest, stacking on mobile (Tinyfrog, n.d.) | "Why it's different" section: the largest tile is the three-case comparison |
| Progressive disclosure | Show primary options first and move secondary ones to a later step, to reduce complexity (Nielsen, 2006) | Five-step setup wizard; decision picker before any form; month table hidden in a `<details>`; result first, detail charts below |
| Communicating uncertainty to non-experts | Lay users manage best with simple formats such as numerical ranges, not full distributions; a reference line reduces cognitive load *(verify: Bhatt et al., 2021; Williams et al., 2023)* | Three named cases instead of probabilities; a range line ("pessimistic … optimistic"); a dashed baseline reference line in charts |
| Simple, glanceable charts | Bar and line charts are the easiest to read; save strong colour for the one key number *(verify: NN/g via secondary sources)* | Only bar and line charts. Green/red is reserved for better/worse, and amber marks what a decision changes |
| Accessible contrast and focus | WCAG 2.2: text 4.5:1 (AA); UI components and graphics 3:1 (1.4.11); visible focus with sufficient contrast (2.4.7, 2.4.13) (W3C, 2023) | Muted text darkened to `#66615b` to pass AA on the warm background; 2 px navy focus outline on every control; labels, `aria-live` on the live preview, `role="radiogroup"` on segmented controls |
| Respect reduced motion | Honour `prefers-reduced-motion` by removing or shortening animation (Steiner, 2019); reduced motion means fewer and gentler animations, keeping fades that aid comprehension (Kowalski, 2026) | Under `prefers-reduced-motion: reduce`, entrances become a short fade and all movement (rise, lifts, drawer slide, bar growth) is removed |
| Purposeful, fast UI motion | Animate only with a purpose, never data the user reads; use strong custom ease-out curves, keep UI motion under 300 ms, stagger 30–80 ms, and give every pressable element `:active` feedback (Kowalski, 2026) | Motion tokens `--ease-out`, `--ease-in-out`, `--ease-drawer` in `index.css`; buttons, tiles and segmented controls scale to 0.97 on press; the mobile menu slides with an iOS-like drawer curve and fading backdrop; charts do not animate, because the live preview redraws them as the owner types; the preview dims only when a recalculation takes longer than 200 ms |
| Feel native on a phone | Remove the tap highlight, avoid the 300 ms tap delay, keep inputs at 16 px so iOS does not zoom, use `dvh` instead of `vh`, gate hover by capability (Kowalski, 2026) | Global rules in `index.css` (`touch-action: manipulation`, no text selection on controls, 16 px inputs on coarse pointers); `min-h-dvh` page shells; Tailwind v4 already limits `hover:` to devices that can hover |
| Avoid the "AI-generated" look | Designers name the same tells in generated sites: an unchosen default font, purple or blue gradients, a hero followed by identical icon-and-text cards, eyebrow labels above headings, generic headlines, and scroll fade-ins that hide content (925 Studios, n.d.; Y Combinator, 2026; MindStudio, n.d.). The fix is a point of view built from the product, not the model's defaults (Anthropic, 2026; Bakaus, 2026) | Landing page rebuilt around one story with real engine output; no cards, eyebrows, gradient text, section numbers or scroll fade-ins; a sourced typeface (Archivo) instead of the system font; palette taken from the logo |
| Storytelling on scroll | Each section builds on the previous one, effects must serve the narrative, and a sticky graphic beside scrolling text is the most common pattern; scroll-jacking is to be avoided (Doodledood, 2026; Y Combinator, 2026) | The story section keeps a "plume" chart pinned while five short steps scroll past on native scroll; the chart reveals the months and switches to cash at the cash step |
| Self-hosted web fonts (GDPR) | Loading Google Fonts from Google's servers sends the visitor's IP to Google; a Munich court found this unlawful without consent, and self-hosting avoids it (LG München I, 2022, as reported by The Hacker News, 2022) | Fraunces, Inter and DM Mono are bundled through `@fontsource` packages, so no third-party font requests |
| Performance | Fast first load supports conversion (general practice) | The signed-in app is lazy-loaded, so the landing page does not download the charting library |

## Visual system

Replaced on 15 Nov 2026. The Apple-style system (6 Nov) still read as AI-generated: Anthropic's own design skill lists "the SaaS-card kit" (identical rounded cards with one soft grey shadow) and template chrome (eyebrows, middle-dot meta strings, arrows on buttons) as the commonest generated looks, and the first warm-paper design matched its "cream background, serif display, terracotta accent" cluster (Anthropic, 2026). The direction below was derived with the Impeccable skill's new-work process (Bakaus, 2026), code-led, because its image and dice scripts were deliberately not installed.

**Direction (landing page, revised 15 Nov 2026 after owner feedback)**

The first rendition used the logo navy as a large background field; the owner found it heavy and several sections too plain, and one row layout misaligned. The revision keeps the thesis and changes the world, after the owner chose "colour bands" from three palette directions.

- **Thesis:** the landing page *is* the forecast: one salon's hire, run three times. The first viewport is a working demo, following the 2026 pattern of letting visitors try the product in the hero (SaaSFrame, 2026).
- **World:** a salon's hair-colour swatch ring. White base; each part of the story sits on its own soft tint (mint, sky, lilac, peach); black type; coral for the bad case and teal (the logo's) for the good case. The story stage changes tint as the reader moves from chapter to chapter.
- **Type:** Archivo (self-hosted with its width axis): condensed extra-bold for display, normal width for text.
- **First viewport (revised twice after owner review):** the headline that says what the tool is, for whom and why ("Test salon decisions before you make them."), one supporting line, and one dominant black button on the left; the working example on the right, sized so text and example both fit a laptop's first screen (checked at 1431×731). The example is a white card with one slider (share of new customers) that picks between pre-computed engine runs (`web/src/pages/landing/demoGrid.ts`); the verdict sits on two fixed rows so the card never changes height. Hero guidance: a headline under about eight words and one primary call to action (Framer Websites, n.d.).
- **Small joys:** the example values in "Now run your own salon" are painted in with hand-drawn marker strokes, one after another, the first time the sentence is seen (static under reduced motion).
- **Story:** sticky chart in a white panel beside five short chapters (wages first, ramp-up, new versus moved customers, the tight cash month, three different years).
- **Libraries:** d3-scale and d3-shape for chart geometry, Motion for line morphing and the month reveal, Base UI for the accessible sliders.

**System**

- Edges are crisp 1 px lines (`--shadow-card`); only floating layers (popovers, tooltips) cast a real offset shadow. Radius 12 px for panels, 8 px for buttons.
- Every value still carries its source badge (entered / estimated / sample / calculated); the three-case estimate inputs keep a colour bar per case.
- Light theme only: owners use it in a lit salon or at the counter after closing.

## References

Bhatt, U., Antorán, J., Zhang, Y., Liao, Q. V., Sattigeri, P., Fogliato, R., Melançon, G., Krishnan, R., Stanley, J., Tickoo, O., Nachman, L., Chunara, R., Srikumar, M., Weller, A., & Xiang, A. (2021). *Uncertainty as a form of transparency: Measuring, communicating, and using uncertainty* [Preprint]. arXiv. https://arxiv.org/abs/2011.07586 *(verify author list)*

LG München I. (2022, January 20). *Urteil 3 O 17493/20* [Judgment on embedding Google Fonts]. Reported in: The Hacker News. (2022, January). *German court rules websites embedding Google Fonts violates GDPR*. https://thehackernews.com/2022/01/german-court-rules-websites-embedding.html

Anthropic. (2026). *Frontend design* [Agent skill, Apache 2.0]. GitHub. https://github.com/anthropics/skills/tree/main/skills/frontend-design (vendored in `.claude/skills/`)

Bakaus, P. (2026). *Impeccable* (Version 4.9.1) [Agent skill, Apache 2.0]. GitHub. https://github.com/pbakaus/impeccable (guidance vendored in `.claude/skills/`, scripts excluded)

Doodledood. (2026). *Scrollytelling* [Agent skill]. GitHub. https://github.com/doodledood/claude-code-plugins/tree/main/claude-plugins/frontend-design/skills/scrollytelling

Framer Websites. (n.d.). *Hero section design best practices*. https://framerwebsites.com/blog/hero-section-design-best-practices

Kowalski, E. (2026). *Skills for designers and engineers* [Agent skills, MIT licence]. GitHub. https://github.com/emilkowalski/skills (vendored in `.claude/skills/`)

Nielsen, J. (2006, December 3). *Progressive disclosure*. Nielsen Norman Group. https://www.nngroup.com/articles/progressive-disclosure/

Rovner, A. (2026, September 3). *Effective SaaS landing page structure*. SaaS Hero. https://saashero.net/design/effective-saas-landing-page-structure/

Steiner, T. (2019). *prefers-reduced-motion: Sometimes less movement is more*. web.dev. https://web.dev/articles/prefers-reduced-motion

Tinyfrog Technologies. (n.d.). *Web design trends 2026: 7 trends your site needs now*. Retrieved October 17, 2026, from https://tinyfrog.com/web-design-trends-2026/

Veza Digital. (n.d.). *Best SaaS landing page design examples: The data-driven guide to pages that actually convert*. Retrieved October 17, 2026, from https://vezadigital.com/post/best-saas-landing-page-examples

W3C. (2023). *Understanding Success Criterion 2.4.13: Focus appearance*. World Wide Web Consortium. https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance

Williams, et al. (2023). [Eye-tracking study of uncertainty visualisations for experts and non-experts]. *Geoscience Communication, 6*, 111–. https://gc.copernicus.org/articles/6/111/2023/ *(verify title and authors)*

MindStudio. (n.d.). *How to avoid vibe-coded landing pages*. https://www.mindstudio.ai/blog/avoid-vibecoded-landing-pages

925 Studios. (n.d.). *AI slop fonts and gradients: The tells that give away AI design*. https://www.925studios.co/blog/ai-slop-design-tells

SaaSFrame. (2026). *10 SaaS landing page trends for 2026 (with real examples)*. https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples

Y Combinator. (2026). *Design experts review vibe coded websites* [Video]. https://rosetta.to/u/ycombinator/design-experts-review-vibe-coded-websites
