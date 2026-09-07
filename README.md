# Tai Shan Lin

A personal portfolio with a Three.js business card and hinged metal holder, a Work and Projects index, three HighFi case studies, and three earlier experience pages.

## Run locally

Use Node.js 22 and pnpm 10.28.0, as specified in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Build

```sh
pnpm build
pnpm preview
```

The build includes TypeScript verification. Static hosting should rewrite non-file routes to `index.html`.

## Deployment and archive

The existing Vercel project for `tai-lin.dev` uses `vercel.json` to install dependencies, build the Vite application, and serve `dist/`. Client routes such as `/index` and `/work/utradea` resolve to the application on direct visits and refreshes. Existing `/ebook` and `/ebook.html` links redirect to the Work index. GitHub Actions runs the production build on pull requests and changes to `main`.

All 42 files from the previous repository at `5b40ab5065a3039f30ad0515bad32060ccd823be` are preserved unchanged in [`archive/legacy-site/`](archive/legacy-site/). See [`archive/README.md`](archive/README.md) for local viewing instructions. The archive is excluded from deployment. Local recordings, generated build files, and dependency directories are not part of the migration.

## Content

Edit `src/profile.ts` for Tai's profile and email, and `src/content.ts` for story copy and the `workHistory` role and date metadata. Email links open `taishanlin1996@gmail.com`. Projects remain pending until content is supplied.

The three HighFi case studies are adapted from Tai's [Founding Engineer Profile](https://app.notion.com/p/tai-fde-application-case-studies/Tai-Founding-Engineer-Profile-38a41166402f804ea3d1ec4ae66682b0). Diagrams are explanatory illustrations of the source material.

Earlier experience and all role dates come from [Tai's existing site](https://tai-lin.dev/) and [TaiPanda96/tai at 5b40ab5](https://github.com/TaiPanda96/tai/tree/5b40ab5), using `index.html` and the Prior Work chapter in `ebook.html`. Utradea and BMO each have one detail page containing their accomplishments. Creative Destruction Lab is identified as a student-cohort experience and uses a short page without a section menu. Additional HighFi technical writeups are deferred; Notion remains the source for the three HighFi narratives and their approval boundaries.

## Landing behavior

- The first landing visit in a tab session shows the closed holder.
- A lightweight, clickable image of the holder renders while Three.js loads, without a loading caption. Early clicks reveal the HTML card immediately through a short departure animation; the live scene takes over when ready.
- The holder is a keyboard-accessible button with a pixel hand cursor and immediate press feedback. On release, the lid opens toward the viewer, the card lifts, and the holder accelerates out of view in about 1.2 seconds.
- The lettering stays attached to the paper throughout the reveal. A projected lid silhouette clips the HTML type while the metal covers it.
- `sessionStorage` records the first landing visit, so refreshes and returns home load the exposed card.
- About Me flips the card to a concise bio under an About heading, using the same base type size as the Founding Engineer title.
- The card retains U.S. standard 3.5:2 proportions and stays centered as either viewport dimension changes.
- Desktop pointers use normal-size pixel arrow and hand artwork with surface inversion; touch devices retain their normal behavior.
- Reduced-motion users start with the card exposed, without continuous tilt or float.
- If the WebGL scene fails, an HTML card preserves navigation and the bio.
- Sound is enabled by default, with a toggle beside About Me. Clicking the holder plays the supplied opening clip. Once the card is revealed and the opening clip finishes, the reaction plays in full once per tab session. Pointer movement and flipping the card do not cut it off or restart it.
- Audio eligibility and the sound preference are tracked per tab session. Work, Projects, Email, hiding the tab, and muting fade active audio. Navigation does not wait for the fade. Refreshes and returns home skip both the entrance and its audio.
- Browser audio starts with a click or tap. Touch devices play the opening and reveal cues through the same sequence.

## Index and case studies

Work and Projects open the same index, with both categories always present. Hovering or focusing a category emphasizes its table rows without hiding or moving the other group. The Work table has six entries grouped under HighFi, Utradea, BMO Financial Group, and Creative Destruction Lab, with year ranges beside the work. Each row opens its detail page, where the role and full source dates appear. Projects has a minimal empty state until content is supplied.

The card shrinks into the paper-card breadcrumb in 440ms while the index becomes usable immediately. Returning grows it back into the exposed card. The breadcrumb icon and HTML card share a paper tone matched to the rendered Three.js card. The transition preserves the projected lettering and paper texture, skips animation for reduced motion, and cancels cleanly on viewport resize or browser history navigation.

The index and articles share the landing's sage backdrop. Breadcrumbs follow Card > Index > Detail. Pages with multiple sections have a sticky left rail on desktop and an On this page disclosure on mobile. Figures are optional. Previous and next links move through all entries in the same category, including the transition from HighFi stories to earlier experience. Browser back and forward restore scroll positions.

## Local motion controls

On localhost, 127.0.0.1, and IPv6 loopback, Cmd/Ctrl+K opens a small palette and Escape closes it. It starts hidden, with no floating trigger. The controls follow the current surface: holder before opening, card after the reveal. Each surface has separate saved settings; Reset restores that surface's approved defaults, Copy settings copies its JSON, and Replay entrance re-arms the holder and both sound cues for local review.

The approved defaults are:

| Setting | Holder | Card |
| --- | ---: | ---: |
| Vertical tilt | 15° | 2° |
| Horizontal tilt | 17° | 2° |
| Movement | 10px | 3px |
| Follow speed | 7 | 3 |
| Background depth | 24px | 17px |
| Hover lift | 5.5% | 8% |

The palette is absent on public hostnames, where `src/motion.ts` supplies the defaults. Reduced motion disables pointer parallax and continuous float regardless of the saved values.

## Verification

The production build passes TypeScript and Vite compilation. Browser checks passed in desktop Chromium and iPhone 15 touch emulation for holder opening, bio flipping, index navigation, section links, case-study pagination, and session persistence. Separate browser contexts verified reduced motion, unavailable WebGL, and context loss. Mobile reading pages were checked for horizontal overflow.

The material and cursor refinement was checked while resizing through seven viewport sizes from 1920 x 1080 to 568 x 320. The card stayed centered, controls remained visible, and no page overflow appeared. Pixel cursor switching, mobile touch interactions, the scaled HTML fallback, and the supplied favicon were also verified.

The revised reveal was recorded and inspected frame by frame. Desktop checks verified the hand cursor, press cancellation, keyboard activation, focus handoff, matching 19px title and bio styles, and resizing from 1920 x 1080 to 568 x 320. Touch opening, bio flipping, Work navigation, return/reload session skipping, reduced-motion flipping, and the corrected HTML fallback also passed. The measured reveal completed in 1.18 seconds.

The audio and loading update was checked in Chromium and mobile touch emulation: actual media playback, gain fading to zero, one-time session playback, navigation during playback and pending downloads, mute persistence, early holder clicks before the scene loads, fallback navigation, reduced motion, and local palette controls. A simulated public hostname neither displays nor downloads the palette. The approved motion update verified both presets despite stale shared settings, approximately 5.5% holder hover lift, and natural completion of the entire 18.645-second reaction with the pointer outside the card. Muting, later hovers, flipping, and return navigation do not restart a consumed clip.

One cold production-preview sample at 390 x 844, with 4x CPU throttling, 100ms latency, 750,000 bytes/sec download throughput, and cache disabled, reduced time to a visible clickable holder from 2,316ms to 773ms. This measures the lightweight holder, not completion of the Three.js scene, and is not a field performance benchmark. The Three.js chunk remains approximately 265KB gzipped.

The index refactor was checked in desktop Chromium and mobile touch emulation for both table groups, category hover and keyboard focus, all three work links, breadcrumbs, section focus, the final active section, pagination, browser history, reduced motion, and return-session behavior. The article layout and three diagrams were visually checked at mobile width. Transition snapshots retain the paper and lettering; resizing cancels the animation without leaving hidden content. Fresh browser contexts reported no JavaScript errors. The production recording also verified navigation starts before the 440ms morph finishes.

The work-history expansion passed the production build and browser checks for all six entries, four company groups, role dates, breadcrumbs, previous/next navigation, browser history, direct section links, and return to the exposed card. Desktop and 390px mobile layouts were visually inspected, with no horizontal overflow at 390px or 320px. Fresh mobile captures confirmed the Utradea article and short Creative Destruction Lab page after layout settled. HighFi figures remain present; earlier experience pages omit figures, and Creative Destruction Lab has no empty section menu. The browser checks reported no JavaScript errors.

The repository migration passed a fresh dependency install, production build, and the same six-entry browser checks against its own production preview. All 31 application and public asset files match the approved local site byte for byte. Git blob hashes and file modes confirm that all 42 legacy files, including the symlink, are preserved in the archive. The production output contains no archived pages.

## Design references

- [Patrick Bateman card](https://hobancards.com/products/patrick-bateman): stock, serif small caps, layout, and letterpress treatment. EB Garamond supplies the prototype typeface.
- [Holo by Arlan](https://www.arlan.me/vault/holo): compact staging and normalized pointer-follow behavior, adapted for actual Three.js geometry. See `THIRD_PARTY_NOTICES.md`.
- [Benji's Drawesome](https://benji.org/drawesome), the supplied writing index, and [Morphing Icons with Claude](https://benji.org/morphing-icons-with-claude): restrained table presentation, article measure, and navigation.
- The supplied holder photograph: geometry, hinge, tray, clasp, and reflective metal.
- [Rauno's interaction design](https://rauno.me/craft/interaction-design) and [depth](https://rauno.me/craft/depth): input feedback, continuous motion, and a layered studio setting.

## MCP dogfooding

The site remains the primary task. A real stdio call to `capture_ui_animation_from_url` against Holo failed before capturing evidence with:

> It looks like you are using Playwright Sync API inside the asyncio loop. Please use the Async API instead.

Follow-up in the separate `video-to-ui-mcp` checkout: reproduce URL capture through an actual MCP call using a localhost fixture, then check the sync/async boundary. The existing analysis tool remains usable for local recordings.

The installed `analyze_ui_animation` tool successfully analyzed the local holder reveal, returning six ordered image frames and schema 0.3.0 motion evidence. The original wrapper saved metadata without forwarding the images to visual inspection, so this call did not inform the design. The recording and result are under ignored `output/playwright/`.

For the cursor refinement, the tool analyzed the supplied Nachi recording before implementation. All eight images were saved and selected frames were visually inspected. The selection concentrated on the screen-recording toolbar and missed most early cursor movement, so direct browser inspection established the difference blending and hover behavior. Evidence is in ignored `output/references/nachi-mcp/`.

For the reveal revision, the tool selected eight frames from the user's recording. Inspecting them, additional intermediate frames, and the existing code exposed the blank-card interval and incorrect hinge direction. A second call selected eight states from the revised reveal; visual inspection confirmed that the lettering remains attached as the lid opens and the holder exits. The tool's combined-motion easing estimate was low confidence and was not used to choose the animation curve. Evidence is in ignored `output/playwright/reveal-v3-mcp/`.

For the index refactor, two stdio calls to `analyze_ui_animation` returned eight frames each from production-preview recordings. Visual inspection of the first set exposed a brief opacity dip when the returning HTML card handed off to Three.js. The live scene now appears at full opacity beneath the fading HTML card. The second set checked that handoff after the fix. The MCP did not choose the table layout, breadcrumbs, typography, or animation curve. Direct browser snapshots found the earlier projected-lettering alignment issue. The recordings did not reliably show every outbound compositor frame, so explicit animation-time snapshots and live frame measurements supplemented them. Evidence is in ignored `output/playwright/card-index-mcp/` and `output/playwright/card-index-v2-mcp/`.
