# Verdant

<p align="center"><img src="assets/verdant-logo.png" width="150" alt="Verdant terrarium logo"></p>

[Play Verdant](https://ilevytate.github.io/Verdant/) · [Download game ZIP](https://github.com/iLevyTate/Verdant/archive/refs/heads/main.zip) · [Social preview image](assets/verdant-social.jpg)

A mobile-first, procedural 3D terrarium game. Build a planted landscape with soil, stone, driftwood, and water, then follow the Garden Journey. Wildlife is temporarily paused while the game focuses on botanical and terrain realism.

**Plain HTML, CSS, and JavaScript. No Jekyll, Ruby, framework, compilation, or backend is required to host the game.** The Babylon.js engine and environment lighting are bundled locally, and the interface uses device fonts with no external font requests.

## Botanical focus release

- **Desktop workspace and reliable settings:** a collapsible build panel, centered editing dock, readable right-side panels, direct Terrarium access, and Garden / Display / Files settings groups. Settings show a persistent saved status. Focused dropdown choices survive UI refreshes, display preferences save immediately, and terrarium changes apply only after a verified save. See [desktop verification](DESKTOP_QA.md) for layout and reload evidence.
- **Choose your terrarium:** Care & display → **Shape, size & base** offers a round bowl, glass cylinder, tall jar, or oval garden; Compact, Standard, and Roomy growing areas; and limestone, dark slate, or glass-only bases. The same choices are available in New world. Changing an existing vessel keeps its terrain edits, plants, and progress, saves a restore point first, and supports Undo/Redo. Footprint changes map active plants to the same relative ground positions without stretching their models; archived animals remain untouched. A transparent circular contact shadow replaces the visible gray square beneath the pot.
- **Graphics and interaction audit:** faster canopy fitting with the same glass clearance, identical procedural texture pixels with less generation work, shared rain geometry, and soil color updates without rebuilding terrain. Camera framing follows panel sizes and device safe areas; photo view uses the full safe viewport. Primary touch controls are larger, secondary text is clearer, and phones open in Observe mode. Startup recovery can download the original save and check for updates when 3D rendering cannot start. See [quality audit](QUALITY_AUDIT.md) for evidence and remaining device checks.
- **Placement and camera refinement:** previews now use the exact next specimen's variant, starting size, health, pruning, and terrain adjustment. Individual clover, grass, flower, and mushroom stems meet local ground heights while keeping their shapes. Close-ups follow growth and pruning, survive phone rotation and graphics changes, and reset to the complete terrarium. Photo mode prevents planting/sculpting taps; mouse ray queries and previews are coalesced to one display frame.
- **Rendering follow-up:** corrected inward-facing botanical and soil surfaces, continuous branch geometry and bark UVs, correctly oriented driftwood cuts, single-layer glass geometry, and water/background color processing. The new rendering regression suite checks these cases and repeated graphics switching without changing saved worlds.
- **Animals are temporarily removed from play.** Wildlife is not rendered, generated, selectable, counted, or used for placement/ecology. Every animal record in an existing save remains intact, including identity, position, variant, size, health, and paid seeds. No save key or terrain data is reset.
- **All nine plant models have been rebuilt:** arching fern fronds, fine moss shoots on an irregular cushion, clover leaflets, curved daisy petals and stamens, detailed mushroom caps/gills, branched juniper sprays, ribbed/spined cacti, solid waxy succulent leaves, and folded grass blades. Bark, foliage, and flower parts use separate physically based surfaces with UVs and fine surface detail. Groundcover conforms to local slopes.
- **Scanned soil, bark, stone, and desert sand:** twelve bundled 1K maps provide color, normal detail, and ambient-occlusion/roughness/metal channels. Mineral grit and leaf litter add small real geometry. All maps are included in offline/PWA downloads. See [asset credits](assets/ATTRIBUTION.md).
- **More natural light and water:** restrained color grading, leaf translucency, directional contact shadows, depth-tinted clear water, subtle ripples, and a quieter photographic view. Decorative pollen, bloom, and always-visible seed rings are disabled. The harvest control and inspection still expose seed readiness.
- **Detail choices:** Cinematic uses the complete botanical geometry; Auto balances phone/desktop detail; Performance uses fewer shoots and surface segments. Switching refreshes the models without changing saved entities. Glass-free view, close-ups, calm motion, rapid growth, and sculpting remain available.
- **A plant-only journey:** groundcover diversity replaces the animal objective. Meadow and damp-moss discoveries replace animal-dependent goals. Existing mission indices, rewards, and earned discoveries are retained.
- **Reliable saves and updates:** persistent save-failure alerts, export/import, dated restore points, safe update checkpoints, manual update checks, and the persistent ready Update button remain active. Choose **Save & update now** when prompted; **Later** keeps the update accessible.

The engine remains Babylon.js, with revised geometry, materials, and lighting. Automated checks cover geometry, UVs, material configuration, offline assets, phone camera framing, and save compatibility. The cloud browser cannot create WebGL contexts; final real-device GPU appearance and performance still require device acceptance.

## Host on GitHub Pages, without Jekyll

The standalone repository has `index.html` and `.nojekyll` at its root. Assets use relative paths, so both a domain root and a Pages project URL work.

### GitHub Pages from main

This repository is prepared for **Deploy from a branch → main → / (root)**. The root .nojekyll marker bypasses Jekyll, and the game files are served directly without a build. The included Game checks workflow tests changes and does not run a second deployment.

### Repository logo and social preview

- The transparent logo is at [assets/verdant-logo.png](assets/verdant-logo.png).
- The earlier illustrated GitHub social preview is [assets/verdant-social.jpg](assets/verdant-social.jpg), exactly **1280 × 640**, under 1 MB.
- To set the repository card, open **Settings → General → Social preview → Edit → Upload an image**, choose that JPG, and save. That earlier key art includes animals and does not represent the current botanical-only build.
- Launcher icons and the game header use the new emblem. See [BRANDING.md](BRANDING.md) for source artwork and generation notes.

### Other static hosts

Publish the folder containing `index.html`. There is no build command. Keep `assets/`, `vendor/`, all JavaScript and CSS files, `sw.js`, and `manifest.webmanifest` beside it. Serve over HTTPS for PWA installation and offline support. The bundled server on localhost also supports PWA development. No account service or API credentials are needed for gameplay.

## Play locally

With Node 22 or newer:

```
npm start
```

Open `http://localhost:8080`. Installing npm dependencies is not required simply to serve and play the bundled game. An HTTP server is needed because browsers restrict loading environment textures through `file://` URLs.

## Install and play offline

The primary website is **https://ilevytate.github.io/Verdant/** and opens directly into the app. Choose **Get app** in the top bar for installation instructions or **Download game files (.zip)**. The ZIP always comes from the current `main` branch and contains the complete app and its assets. Installation is also available in **Care & display**. Chrome and Edge can show their native prompt; the fallback panel explains iPhone/iPad, Android, and Mac installation. Wait for **Ready to play offline** before disconnecting. The first complete cache is roughly 14 MB. Installed and browser play use local device storage; use world export/import to transfer saves between hosts or devices.

The service worker intercepts only the game's own static shell, not API routes, account data, downloads, or other projects on the same origin. Updates keep one complete release together until you choose **Update app**. Before committing runtime changes, run `npm run release:cache`. It fingerprints the complete offline game; `npm run check` rejects a stale fingerprint, so runtime updates cannot accidentally reuse the previous release cache unnoticed.

## Mobile controls

- Phones open in Observe. Open Build, choose Plants or Terrain, then tap the soil to place an element. Swipe the tray horizontally to see more choices.
- Drag to orbit and pinch to zoom. Observe collapses the tray. The handle reopens it.
- Use the sliders icon for **Care & display**: mist, vent, sunlight, weather, growth speed, lighting lock, glass visibility, and graphics quality.
- Inspect a plant or landscape element to harvest, move, remove, or open its **Close-up** view. Junipers also offer **Trim bonsai** and **Let regrow**. Reset the camera to return to the complete terrarium.
- A gold ring marks the selected plant when its seeds are ready. The tray's harvest button collects every ready plant.
- The sun/moon button cycles Daylight locked → Natural cycle → Moonlight locked. This changes the view rather than skipping time.
- Pause freezes the procedural simulation. Garden care needs still follow real time. Growth speed and lighting remain independent of the 1×, 5×, and 20× simulation clock.

Desktop shortcuts: Space pauses, M mists, I inspects, R rotates, −/+ changes element size, H hides the UI, Escape selects Observe, and Ctrl/Command Z or Ctrl/Command Shift Z undo and redo.

On desktop, the top-bar **Settings** button opens Garden, Display, and Files sections. **Terrarium** opens shape, growing area, and base choices directly. Click a plant while in Observe to inspect it. Keys **1–9** choose plants; the left panel's arrow collapses the building tools. **Saved on this device** confirms a completed write; use **Save settings** to retry explicitly. Storage failures keep export/retry controls visible.

## The living landscape

Seeded woodland, rainforest, and desert terrain includes hills, valleys, creeks, islands, dunes, and oases. Weather follows the seed, time, and biome-specific seasons. A saved soil-moisture grid responds to rain, evaporation, slopes, shorelines, moss, and canopy shelter. Wet slopes gradually transport soil downhill. Healthy plants can self-seed in suitable, uncrowded soil.

Trees soften local light, organic matter feeds nearby growth, and varied flowering patches complete the meadow discovery. The **Living landscape** setting controls self-seeding and erosion. There are nine active plant species, eight journey chapters, five plant/terrain discoveries, and seven ranks. The seven archived animal types are retained only for save compatibility and future work. Free build removes planting costs while keeping the simulation and progression.

This is an illustrative game, not a biological or fluid-dynamics model.

## Saves and settings

App updates reuse `verdant-world-v1`; they do not regenerate the landscape or clear browser storage. Saving keeps the previous valid world, and accepting an update creates a separate checkpoint before activation. If loading fails, Verdant offers a raw download, backup restoration, retry, or import of a previously exported world. The unreadable original is preserved during an explicit recovery. Conflicting saves from another tab stop the stale write and ask you to export or reload. These protections do not replace exporting important worlds or prevent browser/OS storage eviction.

Worlds save automatically in the current browser. New world offers JSON export and validated import for moving between devices or hosting domains. Earlier saved layouts are preserved and gain the rapid-growth and daylight-lock defaults if those settings are missing.

The procedural terrain and growth simulation runs while the page is visible. Garden care needs catch up from the last saved timestamp when you return, including offline. Self-sustaining worlds remain safe while away. Earlier saves default to Self-sustaining to avoid retroactive neglect. The scene limit is 220 visible elements, and natural spreading is capped at thirty offspring. Up to 220 archived animals can be retained separately without consuming planting or self-seeding capacity.

## Development and checks

See [improvement research and next-work priorities](docs/IMPROVEMENT_RESEARCH.md) for the October 30, 2026 review of settings scope, concurrent saves, release consistency, geometry budgets, botanical realism, and remaining device checks. That report distinguishes current behavior from proposed changes.

```
npm ci
npm run release:cache
npm run check
npm test
npm run test:scene
npm run bench:scene
```

The scene test uses Babylon's official NullEngine and `@napi-rs/canvas` to validate all biome scenes, botanical geometry/UVs/materials, archived-animal invisibility and preservation, rendered-triangle terrain, frame-independent rain, mature previews, and full-object close-ups on four phone layouts without a GPU. The production HTML and `game.js`/`pwa.js` also receive DOM interaction checks using LinkeDOM with a substituted renderer: touch placement, trimming/Undo, settings, saving errors, backups, deferred updates, and save-before-update consent. These checks do not measure CSS layout, GPU output, heat, battery, or native install dialogs; physical-device acceptance remains necessary.

`node scripts/prepare-pages.mjs` prepares the static `_site/` directory. In an editing checkout that has `dist/`, the server and packaging helpers use that folder. In the standalone repository, they use the root game files.

## Credits

- Rendering engine: Babylon.js 8.32.0, Apache License 2.0. See `vendor/BABYLON-LICENSE.md`.
- Studio environment: Babylon.js Assets contributors, Creative Commons Attribution 4.0. The environment is unchanged apart from its filename. See `assets/ATTRIBUTION.md` and `assets/BABYLON-ASSETS-LICENSE.txt`.
- Plant meshes, archived animals, terrain, and audio are generated from this project's source code. Brand artwork was generated with OpenAI image generation. No external model downloads are needed to play. Scanned surface maps from Poly Haven are CC0 and bundled locally.
