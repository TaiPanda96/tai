# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- A complete archive of the 42 files in the previous static portfolio, preserving their contents and directory structure.
- Vercel build configuration, client-route handling, redirects from the previous ebook, and a GitHub Actions production build check.
- Experience pages for Utradea, BMO Financial Group, and Creative Destruction Lab, adapted from Tai's existing site and repository.
- A reversible card-to-breadcrumb morph with immediate navigation, reduced-motion support, and cleanup on resize or browser history changes.
- Card > Index > Case study breadcrumbs, with article section navigation in a desktop rail or mobile disclosure.

- First-session opening and reveal audio from the supplied recordings, with a default-on sound toggle, one-time playback, and short fades on navigation, mute, and tab hiding.
- A local motion palette with six live settings, Cmd/Ctrl+K, saved preferences, reset, copy, and entrance replay.
- An interactive lightweight holder and HTML card while the Three.js scene loads.
- Windows 98 style pixel cursors with surface inversion, link feedback, and touch-device opt-out.
- Three.js business card holder with a hinged lid, tray, clasp, reflective materials, pointer tilt, and floating motion.
- A first-visit opening sequence tracked per tab session, with direct card access on refresh and return navigation.
- A Bateman-inspired card for Tai Shan Lin with Work and Projects navigation and an About Me flip.
- A shared table index with Work and Projects groups, category hover and focus emphasis, and direct links to case studies.
- Three HighFi case studies based on Tai's supplied profile, with explanatory system diagrams, section navigation, and previous/next links.
- Responsive reading layouts, reduced-motion handling, self-hosted fonts, and an HTML fallback for unavailable WebGL.
- Setup documentation, source attribution, and a recorded MCP URL-capture failure for follow-up.

### Changed

- Replaced the active static portfolio with the approved React, TypeScript, and Three.js site. Pinned the package manager and documented the Node.js runtime.
- Expanded Work to six entries across four organizations, with year ranges in the table and full role and date context on each detail page.
- Connected previous/next navigation across HighFi and earlier experience, made figures optional, and omitted section menus on brief pages.
- Rebuilt the index as Work and Projects table groups on the landing's sage backdrop. Removed intros, section lists, item numbers, repeated personal details, and redundant footers.
- Simplified case-study typography and metadata while retaining previous/next navigation and explanatory figures.
- Matched the breadcrumb icon and HTML card to the exposed Three.js card's paper tone and cotton texture.
- Matched Email's hover and focus underline to Work and Projects and reduced the retro cursor to normal dimensions.

- Set separate approved motion presets for the metal holder and exposed card, including hover lift for both surfaces. Old shared preview settings no longer override them.
- Let the reaction clip play in full after the card is revealed, regardless of pointer movement, once per tab session.
- Hid local motion controls by default and removed their floating trigger. Cmd/Ctrl+K still opens the controls for the current surface.
- Increased pointer tilt and movement, added opposing background parallax and adjustable hover lift, and kept card links steady during interaction.
- Removed the loading caption, split reading pages and case-study content out of the initial script, preloaded landing assets, and losslessly compressed the cotton relief texture to WebP.
- Reworked the first-visit reveal with immediate press feedback, a weighted hinge, card lift, and an accelerating holder exit lasting about 1.2 seconds.
- Replaced the opening captions with a hand cursor and an accessible button that follows the metal holder.
- Simplified the back to an About heading and a concise bio, sized to match the Founding Engineer title.
- Added directional studio lighting and cast shadows to separate the paper, holder, and backdrop.
- Replaced synthetic paper noise with photographed cotton fibers, stronger surface relief, recessed black ink, and a more visible stock edge.
- Set the card to the U.S. standard 3.5:2 proportions and placed it on a cooler backdrop with stronger contrast.
- Centered the card independently of its controls and made its scale respond to both viewport dimensions.
- Replaced the monogram favicon with the user's supplied American Psycho close-up.

### Fixed

- Browser history restores reading positions, the final article section stays active at the document bottom, and returning to the card restores the landing title.
- Projected card lettering and paper stay aligned during the navigation morph. The returning card stays opaque as the live scene takes over.

- Email links now address `taishanlin1996@gmail.com`.
- Reading-page hash navigation and heading focus wait for lazy page content to mount.
- Keyboard focus moves to About Me after the holder exits, and the HTML fallback retains the card's proportions at mobile widths.
- The lid opens toward the viewer instead of passing through the paper. Its projected silhouette reveals the lettering continuously with the card.
- The HTML fallback scales its typography with the card so the mobile bio and signature remain separated.
- The WebGL canvas now shrinks with its grid container when the browser window is resized.
- WebGL support is checked before asynchronous scene initialization so unavailable graphics correctly show the HTML card.
- Hidden 3D card faces no longer intercept navigation clicks; the card holds still while its navigation is in use.
- Card small caps render consistently alongside the cotton-paper grain.
