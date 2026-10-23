Latest: removed former slide 13. The deck now has 37 slides; chapter 2 starts at 14 and results at 29.

## Autonomous 16:9 demo

Slides 2-3 now use an automatic loop without controls. The SVG has a 960x540 viewBox and fits the 16:9 presentation viewport. It follows the synthetic base fixture: 12 buses, 3 routes A/B/C, 6 stops each, 2 directions, 40-seat capacity; initially 2 buses at S0 and 1 at S5 per route plus 3 reserves. Timings at 60x: 180s per edge, 30s intermediate dwell, 120s terminal layover and 360s depot travel. An illustrative dispatch at t=120s reaches route B at t=480s. A 40-second visual loop restarts the illustration. This is a deterministic teaching sequence, not a live simulation or algorithm result. Reduced-motion mode shows the initial static state.

## Animated network demo

Slides 2 and 3 now show a lightweight SVG illustration inspired by the supplied map. Three buses loop along routes 33, 50 and 08. Dispatch reserve sends a fourth bus physically from the depot onto route 50. Pause and Reset control the demo. Reduced-motion preferences start the demo paused. This is a teaching illustration, not a simulator output or measured service result. network-demo.js uses one animation loop and cancels it on slide navigation.

## User-supplied images

Slide 1 uses assets/bus-crowd-user.png, without a displayed source caption. Slides 2 and 3 use assets/network-user.png instead of the schematic demo; click to enlarge. The supplied images are preserved unchanged.

# Latest presentation revision

38 slides. Slide 37 shows absolute Total Cost with separate truncated axes to zoom into the bar tops. Data: reports/tables/held_out_per_seed.csv, averaged over three seeds. Regenerate with draw_ablation.py. Former slides 38-40 are replaced by one final slide, What Did We Learn?, covering five evidence-based findings in plain English.

# Part 3 update

The deck now has 40 slides. Slides 32-35: Ablation Study 1: Encoder. Slide 36: Ablation Study 2: Mask vs No Mask, including consistent findings across Normal, Burst and Traffic. Former slides 37-38 are removed. Slide 37 (former 39): Ablation Study 3: Available Action.

The new vector figure zooms into cost changes relative to Core and shows 95% confidence intervals from reports/tables/ablations.csv. Fairness is explicitly identified as a reward ablation. Regenerate it with `../.venv/Scripts/python.exe draw_ablation.py`.

# Bus RL presentation

The deck has **40 slides**, retaining the 15-slide Part 2. Results starts at slide 30. Slide 36 consolidates the retrained GRU10 algorithm/mask comparison across three conditions; slide 37 uses a reproducible vector cost-delta plot.

Original report images remain on slides 32-34 and 36. Click any result image to enlarge it. Sources opens repository references and supplementary figures. The imported originals retain their SHA-256 provenance in content/repo-figures.json; draw_ablation.py generates the new SVG directly from the ablation CSV.

Chapter ranges: Environment (1–14), MaskablePPO and training (15–29), Results (30–42). Part 2 follows the fifteen sections of the supplied `content_part2_maskableppo.md`; the source snapshot is stored at `content/part2_source.md`, concise English slide content at `content/part2.json`, and the full Vietnamese source explanations in presenter notes. Repository corrections are attached by the builder. The academic styling is in `academic.css`; teaching diagrams are in `training.js`, repository figures and source navigation in `evidence.js`.

Open `index.html` directly in Chrome or Edge. All required assets, fonts, Markdown parsing and KaTeX rendering are local; no server or internet connection is required.

## Presenting

- Right / Left arrows, Space, Page Down / Page Up: next / previous slide.
- F: fullscreen. Escape: leave fullscreen or close notes.
- During fullscreen presentation, the Present button and bottom control bar are hidden. Keyboard and swipe navigation remain available. Exiting fullscreen restores the controls; browsers without fullscreen support use the same clean presentation view, exited with Escape or F.
- G: slide overview. N: toggle presenter notes.
- Home / End: first / last slide.
- Use the chapter tabs to jump between the three parts. On phones, swipe horizontally to change slides; scroll vertically to read a longer slide.
- Slide 11 has an action-mask toggle. Slides 2 and 13 have an illustrative dispatch animation. Slide 22 explains the masked distribution and sample-mask consistency with a simplified teaching diagram.

Notes open on the same screen and are visible to anyone viewing that screen. Close them before sharing the screen if needed.

Parts 1 and 3 follow `../bus_rl_presentation_slide_spec.md`; Part 2 uses `content/part2.json`. `build_data.py` combines them and attaches the full source notes to each Part 2 slide. To regenerate `slides.js`: `../.venv/Scripts/python.exe build_data.py` from this folder. The generated slide numbers, chapter jumps, navigation limits and progress indicator follow the combined data.

## Assets

Opening photograph and network illustration: supplied by the user in this session.

General Sans: Fontshare / Indian Type Foundry, free font under Fontshare's terms. KaTeX and Marked: MIT-licensed libraries. Vendor source headers retain their notices.

## Checks

`node --check app.js`, `node --check training.js` and `node --check evidence.js` check syntax. `verify.mjs` visits all 40 slides at three widths and checks math, overflow, navigation, chapter structure and notes. `verify-evidence.mjs` checks imported-image hashes, reference paths, image loading and source/figure dialogs; `verify-fixes.mjs` checks slides 12/14 and fullscreen behavior. These development utilities use the installed taste skill's Chrome driver; the presentation itself has no such dependency. Measurements are saved under `../.taste-skill/`.

See `../.taste-skill/design-report.md` for design decisions and visual review.
# presentation-rel
