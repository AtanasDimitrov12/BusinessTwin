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
| Respect reduced motion | Honour `prefers-reduced-motion` by removing or shortening animation (Steiner, 2019) | Only subtle fade-and-rise and hover lifts; all animation disabled under `prefers-reduced-motion: reduce` |
| Self-hosted web fonts (GDPR) | Loading Google Fonts from Google's servers sends the visitor's IP to Google; a Munich court found this unlawful without consent, and self-hosting avoids it (LG München I, 2022, as reported by The Hacker News, 2022) | Fraunces, Inter and DM Mono are bundled through `@fontsource` packages, so no third-party font requests |
| Performance | Fast first load supports conversion (general practice) | The signed-in app is lazy-loaded, so the landing page does not download the charting library |

## Visual system

- **Palette** (from the prototype): warm paper background `#f7f5f1`, white surfaces. Navy for structure, taken from the logo (`#012856`). Amber `#c8652a` for "what this decision changes"; green and red only for better/worse. The logo's teal (`#00b598`) appears only in the logo for now.
- **Type**: Fraunces (display headings), Inter (text), DM Mono (numbers), as in the prototype.
- **Components**: cards with soft shadows, pill badges for source labels (entered / estimated / sample / calculated), a business-map flow diagram, three-case estimate inputs with a colour bar per case.
- **Light theme only**, as requested; the earlier version followed the OS dark mode.

## References

Bhatt, U., Antorán, J., Zhang, Y., Liao, Q. V., Sattigeri, P., Fogliato, R., Melançon, G., Krishnan, R., Stanley, J., Tickoo, O., Nachman, L., Chunara, R., Srikumar, M., Weller, A., & Xiang, A. (2021). *Uncertainty as a form of transparency: Measuring, communicating, and using uncertainty* [Preprint]. arXiv. https://arxiv.org/abs/2011.07586 *(verify author list)*

LG München I. (2022, January 20). *Urteil 3 O 17493/20* [Judgment on embedding Google Fonts]. Reported in: The Hacker News. (2022, January). *German court rules websites embedding Google Fonts violates GDPR*. https://thehackernews.com/2022/01/german-court-rules-websites-embedding.html

Nielsen, J. (2006, December 3). *Progressive disclosure*. Nielsen Norman Group. https://www.nngroup.com/articles/progressive-disclosure/

Rovner, A. (2026, September 3). *Effective SaaS landing page structure*. SaaS Hero. https://saashero.net/design/effective-saas-landing-page-structure/

Steiner, T. (2019). *prefers-reduced-motion: Sometimes less movement is more*. web.dev. https://web.dev/articles/prefers-reduced-motion

Tinyfrog Technologies. (n.d.). *Web design trends 2026: 7 trends your site needs now*. Retrieved October 17, 2026, from https://tinyfrog.com/web-design-trends-2026/

Veza Digital. (n.d.). *Best SaaS landing page design examples: The data-driven guide to pages that actually convert*. Retrieved October 17, 2026, from https://vezadigital.com/post/best-saas-landing-page-examples

W3C. (2023). *Understanding Success Criterion 2.4.13: Focus appearance*. World Wide Web Consortium. https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance

Williams, et al. (2023). [Eye-tracking study of uncertainty visualisations for experts and non-experts]. *Geoscience Communication, 6*, 111–. https://gc.copernicus.org/articles/6/111/2023/ *(verify title and authors)*
