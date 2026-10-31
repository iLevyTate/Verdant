# Verdant quality and save-preservation audit

## Version 4 implementation, October 31, 2026

The research plan now has software implementations for scoped preferences/history, editing ownership, verified/pinned releases, species clearance, independent view lighting, detail/instancing, compressed color maps, battery/idle drawing, local leaf development/motion, branch pruning, wet/sloped soil, Cinematic reflection, keyboard editing, biome recipes, named slots and PNG export. See [the implementation record](docs/IMPLEMENTATION_4.md) for the exact scope and data semantics.

The dense 220-plant phone fixture references 1,131,924 plant triangles versus 2,889,300 in the audit. Twenty-seven production WebGL2 shader pairs compile/link with Mesa GLES software rendering. These establish geometry and shader validity; physical GPU appearance, native lifecycle, sustained device performance and accessibility acceptance remain explicitly unverified.

## Desktop workspace and settings persistence (October 29, 2026)

The desktop pass replaces crowded floating controls with a bounded build panel, a centered editing dock, and a right rail shared by garden status, grouped settings, journey, and inspection. The inventory scrolls independently and collapses to a narrow rail. Desktop settings separate Garden, Display, and Files; their content scrolls between fixed section/save controls. Header labels expose Settings and Terrarium. Camera bounds include the dock, hint, and inspector. Desktop keyboard shortcuts continue after button clicks, the ninth plant has a shortcut, and Observe clicks inspect existing plants.

The reported settings problem exposed two concrete gaps: focused dropdown values were reassigned by periodic UI refreshes, and the terrarium form closed before its debounced save was confirmed. Focused controls are no longer overwritten. Discrete display/care/weather preferences now save immediately. Terrarium changes use a candidate copy and a dated snapshot, verify the save before applying the world, and retain the form/current garden on failure. Storage writes are read back, including preservation points. Successful status is shown only after confirmation, and retry/export remain available on failure. Desktop settings stay open as focus moves to the garden.

Expanded production DOM/storage tests cover focused edits across UI refresh, immediate stored values, a second app loading those values, silently discarded writes, and failed terrarium saves followed by retry. All prior suites remain required. Browser UI checks used production code with a NullEngine/readiness fixture at four desktop viewports; actual browser-local settings and terrarium choices survived reload. This validates UI layout and persistence, not GPU output. See `DESKTOP_QA.md` and its labelled settings screenshot for evidence. Existing save keys, schema, terrain, plant progress, archived animals, backup history, and user-approved app updates remain preserved.

## Base correction and configurable vessels (October 29, 2026)

The supplied overhead screenshot exposed the contact shadow's rectangular carrier. Its dynamic texture did not declare an alpha channel. The replacement is a circular disc with explicit texture alpha and alpha blending, no depth writes, transparent outer pixels, and a restrained radial falloff. The display base has a thinner bevel, optional limestone/slate finishes, and a glass-only option that brings the studio floor up to the vessel bottom. Base and shadow footprints follow the chosen vessel.

Care & display and Field Guide → Your world now open a separate terrarium editor; it does not generate a replacement landscape. Four shapes (round bowl, cylinder, tall jar, oval), three footprints (0.80×, 1.00×, 1.24×), and three base choices are also available in New world. Native labelled controls and illustrated radio choices expose the options; the growing-area summary updates before Apply. Vessel and creation dialogs retain dark readable text in night lighting.

Terrain vertices, exact height/soil sampling, sculpting, hydrology, self-seeding, ground litter, pond depth texture, rain, vessel walls/rims/reflections, glass clearance, decoration fitting, and camera bounds share the selected footprint/profile. Plant meshes keep their physical proportions. An explicit footprint edit scales only active entity ground coordinates and the pond anchor to preserve relative positions. It retains every terrain height and soil sample, entity ID/type/variant/size/health/growth/pruning/harvest field, seeds, progression, care, and every archived animal record. The terrain grid remains the same resolution at all sizes. Compact glass may fit foliage more tightly; new placement still reserves whole-object or mature-canopy clearance.

Existing version 1/2 worlds default to the original Standard round bowl and limestone base. Loading an update does not resize or regenerate them; unsupported vessel values stop validation rather than silently selecting a different world. Applying a design requires a successful dated snapshot, then records session Undo. Cancel and failed snapshots leave the existing state unchanged. Shape changes release the prior glass geometry and reuse their materials; repeated switching does not accumulate scene resources.

Evidence: `tests/vessels.test.cjs` checks old/new save round-trips, exact original-byte backups, archived records, all 12 shape/size combinations, every actual plant/decoration vertex against the selected glass, real ray intersections after sculpting, four camera layouts, transparent shadow pixels, base finishes, and repeated resource counts. Expanded production DOM tests check cancellation, Apply, Undo/Redo, export, failed snapshots, and New world options. Full prior suites remain required. The live cloud browser again reports WebGL unavailable, so final GPU appearance of the base and new vessels remains a real-device acceptance item.

## Graphics, interaction, and performance audit (October 29, 2026)

This pass profiled the existing renderer and reviewed startup, touch targets, keyboard behavior, usable camera space, storage failures, and update completion. The renderer remains Babylon.js; these findings were in the application rather than a missing engine capability.

| Finding | Correction and evidence |
| --- | --- |
| Every animated canopy transformed all of its fitting corners, even far from the glass. | A conservative cached cylinder rejects no valid boundary check: clearly contained plants take a fast path; plants near the wall/rim retain the detailed fit. The full transformed-vertex glass tests remain required. The dense 220-element/20× profiled animation median fell from 7.37 to 3.29 ms in this host run. This is CPU evidence, not GPU FPS. |
| Procedural color and normal textures repeated the same expensive height calculations. | One temporary height field serves both texture maps, then is released. Five full-resolution pixel hashes match the preceding production textures exactly. |
| Disabled effects and picking still allocated resources or performed work. | Remove the disabled glow layer and pollen instances, share one rain cylinder among all drops, skip Babylon's automatic down/up/move picking while retaining explicit editing rays, and skip dormant animal navigation work. The drawing buffer no longer remains preserved when no framebuffer export uses it. |
| Moisture changes rebuilt terrain, normals, skirts, ground detail, and water-bed data. A sculpt could repeat that work on a later frame. | Color-only refreshes reuse cached static terrain tones. Geometry and pond-bed refreshes follow actual terrain revisions. Tests verify mist changes color without replacing geometry, sculpting refreshes once, and rendering does not mutate the world. |
| Fixed camera layout guesses could put the vessel beneath controls; photo view retained the interface's viewport. | Camera bounds use measured panel rectangles and device safe areas, with coalesced ResizeObserver updates. Photo view uses the complete safe viewport. Projection tests cover portrait, landscape, desktop, and photo view; existing close-up rotation/growth tests remain active. |
| Several controls were 24–35 px high, secondary text had weak contrast, and mobile rows could clip their contents. | Primary icon, placement, climate, and footer controls have 44 px targets; mobile cards/rows and landscape groups are sized together. Secondary text now measures at least 5.25:1 on the checked day surfaces and 6.70:1 on the checked night surface. Safe-area offsets and 16 px mobile form inputs are included. This is targeted improvement, not a full accessibility certification. |
| Mobile started with an active planting tool hidden in the collapsed tray. Care/inspection dismissal and held shortcuts were inconsistent. | Mobile starts in Observe after load/import/replacement. Escape dismisses Care or inspection and restores focus; leaving the nonmodal Care sheet closes it. Unrelated modifier shortcuts and repeated one-shot keys do not edit the world. |
| A failed renderer exposed inactive controls to keyboard/accessibility navigation and offered no direct download of the original save. | The app/canvas remain inert until scene readiness. Startup recovery exposes retry, exact saved-byte download, update checking/status, and install/download. Missing engine and failed WebGL paths keep the original save unchanged and can accept an update through a preservation checkpoint. Empty installations can update without creating a fictitious saved world. |
| Failed world replacement closed its form and consumed session Undo; an indefinitely pending update check could remain stuck. | Replace/import forms close and add Undo only after the backup succeeds. Update checks time out after 15 seconds and permit retry; applying an update still requires user consent and a successful preservation checkpoint. |

Evidence: `tests/guru.test.cjs`, expanded production DOM and update tests, all prior geometry/save/scene suites, and the CPU diagnostic in `BENCHMARK_BASELINE.md`. Babylon's [scene optimization guidance](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/scene/optimize_your_scene.md) and W3C's [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) references informed these changes.

The live browser still reports WebGL unavailable. Actual shader output, phone layout/touch feel, heat, battery, and GPU frame rates remain physical-device acceptance items in `MOBILE_QA.md`. No save schema, key, plant anchor, terrain height, progression, or archived animal record is reset.

## Placement, terrain contact, and camera refinement (October 29, 2026)

The follow-up traced placement through the core constructor, preview renderer, root geometry, camera projection, and production pointer handlers. It found these reproducible mismatches:

| Finding | Correction and evidence |
| --- | --- |
| All previews used variant 0 and a 0.6 size multiplier. Real seedlings start at 0.4 growth, while decorations start at full size. | A read-only `previewEntity` creates the exact deterministic specimen used by placement, with the same RNG sequence. Previewing does not spend seeds, reserve an ID, or modify state. Ghosts use the actual plant renderer, including health proportions, pruning, local root adjustments, and vessel fitting. Placement checks reserve the chosen variant. Healthy mature outlines show held trims or the eventual natural canopy when regrowing. |
| Flowers and mushrooms anchored all stems at the cluster center; clover and grass were sheared onto a common plane. | Each complete stem cluster samples its own local ground height and translates vertically, preserving its shape and normals. Root spans/bounds are generated with the model, and shared templates stay intact. Offsets are bounded to 0.6 world units and cached in growth/health/roll bands; moss and succulent retain their existing bounded slope treatment. Render-only fitting keeps every plant inside the glass. Extreme slopes or oversized glass-constrained legacy plants may still have approximate contact. |
| Rotating a phone reset the close-up zoom limit, growth could outgrow the frame, and camera target changes could override the intended Reset distance. | Home framing is recalculated for the new viewport, close-ups retain relative zoom/orientation, and target changes preserve spherical camera parameters. Growth/pruning bounds refresh the selected framing. Graphics changes preserve the selected close-up; world/history rebuilds exit an orphaned close-up safely. Reset restores the full terrarium. |
| Pointer bursts repeated expensive terrain picks; photo mode could still edit; mature outlines could remain during sculpting. | Pointer rays and previews use the latest event once per animation frame and cancel when leaving or hiding the UI. Touch placement remains immediate; placement, touch drags, and pinch gestures clear the ghost instead of leaving an overlay. Clean photo view permits camera gestures while blocking planting/sculpting taps. Terrain tools hide both specimen ghosts. Visible-element telemetry excludes archived animals. |

`tests/refinements.test.cjs` compares actual placed/preview mesh buffers and transforms, checks per-stem contact on sloped and curved terrain, preserves cluster normals/shape and serialized state, invalidates reused previews after world changes, and projects growing/pruned close-ups through four phone layouts, quality switching, and Reset. Production DOM tests cover coalesced rays, cancelled previews, and photo-mode edits. The full prior logic, storage, update, geometry, glass, and pruning checks remain required.

The CPU-only density diagnostic completed at 50/120/220 elements. In this host sample, the dense 220-element/20× case reported animation median/p95 6.50/18.71 ms, simulation tick 5.73/6.93 ms, and NullEngine render 11.50/20.74 ms. These components use different sampling cadences, must not be added to infer device FPS, and do not measure GPU, touch, heat, or battery. Physical-phone appearance and performance remain acceptance items.

No world schema, storage key, saved terrain, entity anchor, archived animal record, or progression is reset. Save-before-update consent and recovery protections remain active.

## Rendering follow-up (October 29, 2026)

The previous geometry tests checked finite buffers, bounds, material groups, and UV coverage but missed the direction of surface normals. An independent comparison with Babylon's native upward-facing ground exposed inward-facing botanical primitives, soil, and cross-section geometry. Triangle winding is corrected at the geometry helpers and terrain grid. Rising cactus columns keep their distinct parametric winding; mushroom caps and both driftwood cuts receive explicit orientation checks. Terrain sculpting and bonsai deformation recalculate normals from the corrected indices.

Curved stems and branches now share continuous rings across bends, with distance-based bark UVs. Driftwood cut faces use the exact endpoint frame and radius, closing the branch cleanly. A closed-surface edge test rejects gaps, while UV checks reject texture restarts at each bend.

Water used to apply a display gamma transform before the default rendering pipeline applied another. It now outputs linear color when image processing runs as a post-process, with display conversion retained for the direct-render fallback. Background clear color follows the same pipeline state. Lighting also refreshes when sunlight or pipeline state changes without advancing the clock. A failed pipeline setup restores material-level image processing. Relevant engine documentation: [custom shader image processing](https://doc.babylonjs.com/features/featuresDeepDive/materials/shaders/image_processing/) and [default rendering pipeline / clear color](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline).

Glass and reflection ribbons previously combined duplicated front/back geometry with disabled face culling, blending the same physical surface twice. They now use one geometric surface with both view directions available; glass uses two-sided lighting. Tests reject repeated transparent triangles.

Evidence: `tests/rendering.test.cjs` checks analytic outward/upward normals, cactus/mushroom/cut-face directions, closed branch edges, continuous bark UVs, graphics-switch resource counts, water/background processing states, direct sunlight changes, and sculpted terrain normals. Rendering and graphics switching must leave the serialized world exactly unchanged, including archived animal records. Existing save/update, mobile DOM, pruning, and scene suites remain required. No save format, storage key, terrain heights, animal data, or progression is reset by this release.

This is code and headless geometry validation. The cloud browser still has no WebGL context; real GPU shader output, visual appearance, heat, battery, and physical phone performance remain unverified acceptance items.

## Botanical focus release (October 28, 2026)

This release temporarily suspends wildlife. Older wildlife-related audit results below describe retained, dormant code, not currently available gameplay. Animal records remain in existing saves; no renderer nodes, picking targets, live collisions, pollination effects, generation, or visible wildlife controls remain active. Archived health/identity/position/size data is frozen, and version 1/2 saves retain their terrain and progression.

The active collection has nine plant species and three landscape decorations, plus terrain tools. All plant models are rebuilt with UV-mapped material groups: curved foliage, stems, needles, petal/stamen detail, moss shoots and cushions, gills, cactus areoles/spines, solid succulent leaves, and folded grass. Groundcover conforms to local slopes. Juniper pruning continues to reshape its own geometry.

PBR surfaces use bundled 1K color/normal/ARM maps from Poly Haven for soil, bark, stone, and desert sand, with runtime-generated leaf/cuticle microdetail and translucency. Fine mineral grit and fallen leaves are separate, non-interactive terrain detail. Water uses bed-depth tinting and a Fresnel reflection term. Bloom and decorative pollen are disabled; harvest markers appear only for the selected plant, preserving a quieter view.

Dense rapid-growth gardens reuse ground-conforming geometry until terrain, pose, or a health band changes; only the selected ready plant allocates a harvest ring. Cinematic, Auto, and Performance have bounded geometric detail levels; switching rebuilds visuals and releases superseded templates without changing saved entities. Plant-only groundcover/meadow/moss objectives keep all journey chapters playable while retaining completed mission indices and discovery IDs.

Evidence: `tests/botanical.test.cjs`, expanded botanical scene/UV/material/bounds checks, all pre-existing save/update and production DOM interaction checks. Dormant animal compatibility remains tested separately through `tests/legacy-core.cjs`. Source meshes were also inspected with an offline shape visualization, which does not reproduce Babylon's final PBR/GPU output. This cloud browser cannot create WebGL contexts, so real GPU appearance and physical-device performance remain unverified acceptance items.

---


Reviewed: October 27, 2026. Target: the existing mobile-first app at `https://ilevytate.github.io/Verdant/`.

## Decision

Keep Babylon.js for this release. The application already uses Babylon's geometry, cameras, materials, instancing, shadows, and a custom water shader. A different engine would require a renderer migration; it would not automatically improve these assets or movement rules. The changes here improve behavior, reliability, and mobile load handling while retaining the existing world format.

This is a code, geometry, and automated behavior audit. It is not a claim that visual quality or frame rate has been certified on physical phones. The available interactive browser has WebGL disabled; real GPU appearance, battery use, and touch feel remain device acceptance checks.

## Existing data contract

- Keep the same website, manifest scope/ID, and `verdant-world-v1` storage key.
- Load the existing world through the existing version 1/2 validator. Do not generate a replacement when existing data cannot be read.
- Preserve terrain heights, soil, entity IDs/types/coordinates/scale/rotation/variants, growth, health, harvest readiness, seed balance, progression, discoveries, settings, and care state.
- Save a previous valid world before overwriting the primary. The first autosave after adding preservation support also retains an initial checkpoint when none exists. Keep a separate checkpoint when an update is accepted, so later autosaves do not replace that checkpoint.
- Unreadable or unsupported saves open recovery controls. Raw download, valid-backup restoration, retry, and importing a prior export are available. Explicit recovery retains the unreadable original under a recovery key. If an update is available while recovery is open, it can checkpoint the original bytes and install the newer app without generating a replacement world.
- Detect a stale tab attempting to save over a different stored revision. Stop that write and show an export/reload message. This is optimistic conflict detection, not a multi-user transactional database.
- No update code clears localStorage, removes the world key, regenerates a loaded landscape, or changes saved entity IDs. Explicit New world and Import actions still replace the active world by user choice, with a backup of the prior saved world.
- Saves are local to this browser and site. These backups do not protect against browser/OS data eviction, clearing site data, loss of a device, or moving to another origin. JSON export remains the portable copy.

Evidence: `tests/saves.test.cjs`, existing migration/care tests, and offline/update lifecycle tests. Test cases include valid legacy/current worlds, corrupted JSON, a future unsupported schema, quota failure, disabled storage, backup-only recovery, explicit import recovery, and a stale second tab.

## Follow-up corrections and release acceptance

The follow-up review found gaps beyond the original test coverage. This release addresses them as follows:

| Finding | Implemented correction and evidence |
| --- | --- |
| Phone save errors were only temporarily visible | A persistent alert offers export/retry and, for a conflict, a deliberate load-saved-copy confirmation. It stays visible after the toast expires. Autosave failures retry at a bounded interval. `tests/mobile-ui.test.cjs` exercises the real markup and handlers. |
| Generated animals could fail their own placement rules | New generation chooses suitable homes and thins only its newly generated obstacles as needed. Saved-world validation never runs generation. Exact rendered placement checks cover all initial animals in twelve seed/biome scenes. |
| Objects could be planted over wildlife | Core mature-footprint checks and renderer object/body checks cover reverse placement, including flying animals. Live positions are held outside the serialized state; self-seeding checks them too. Existing overlaps may escape without moving saved anchors. |
| Footing differed from drawn slopes | Height queries now sample the same triangles as the mesh, with cached geometric coefficients. Precision ray checks compare 2,000 points before/after sculpting; picking tolerance is tightened for the test. Mesh height revisions refresh before animal movement. |
| Fixed close-up framing cropped models | Targets and distance derive from complete selected bounds and the current viewport. All selected models are projected inside four phone layouts. Details close for a clear view; selected animals are followed. |
| Bonsai trimming only affected appearance | Shade radius and protection against drying respond to pruning and gradual regrowth. Core tests compare local light and soil outcomes. |
| Rain depended on frame rate | Elapsed-time movement gives equal travel at 30 and 120 Hz. Calm view honors explicit or device reduced-motion preferences and keeps growth/care clocks active. |
| Update detection needed an obvious completion path | Manual checks/status are in Care and Get app; a ready header button survives Later. Confirmation saves/checkpoints, activates the waiting worker, then saves/reloads when controlled. Save failures, network failures, and stalled activation remain recoverable. |
| Recovery needed more history | Up to five dated points within a 768,000-character data budget supplement the original backup/checkpoint/recovery keys. Optional history failure cannot break a successful primary save. Oversized points do not discard existing history. Restore retains the displaced raw world. |

Additional acceptance coverage is in `tests/polish.test.cjs`, `tests/mobile-ui.test.cjs`, and the expanded scene/update suites. The DOM tests substitute rendering and do not certify actual mobile layout or GPU output. Headless density measurements and the physical-device checklist are documented separately in `BENCHMARK_BASELINE.md` and `MOBILE_QA.md`.

## Every placeable element

All 19 placeable elements receive placement, relocation, size/rotation retention, removal, invalid-position, save round-trip, and three-variant checks. All plant species receive growth and single-use harvest checks. Every rendered species/variant is constructed with the real Babylon NullEngine and checked for finite geometry, valid indices, and finite normals.

| Element | Role and quality checks |
| --- | --- |
| Maidenhair fern | Frond geometry, moist/shaded preference, growth and harvest; full rendered bounds obstruct animal routes. |
| Cushion moss | Low hummock geometry, soil retention, shoreline discovery, growth, harvest, and spreading. |
| Woodland clover | Leaf clusters, spreading and forage target; rabbits graze beside its footprint. |
| Meadow flowers | Stem/petal geometry, pollination, seed production; insects target space above the bloom. |
| Golden mushrooms | Cap/stem geometry, damp/shaded preference, nutrient relationship with driftwood. |
| Little juniper | Trunk/canopy geometry, shade and slower nearby evaporation. Frogs no longer target or climb it. |
| Desert cactus | Branch geometry, drought/sun preference, placement, growth, and saved variant. |
| Rosette succulent | Layered leaves, dry habitat preference, spreading, and saved size/rotation. |
| Golden grass | Blade geometry, wind sway, dry habitat preference, spreading, and ground-animal clearance. |
| River stones | All three variants, terrain anchoring, placement/move/remove, shadow casting, obstacle volume. |
| Driftwood | Branch geometry, compost relationship, terrain anchoring, shadow casting, obstacle volume. |
| Quartz cluster | All three variants, terrain anchoring and obstacle volume; included in shadow casting. |
| Micro Holland Lop | Retain the smaller render multiplier and saved IDs. Short hop bursts, preparation/landing, grazing, sniffing, breathing, ear springs, full route clearance, safe inward movement at the rim. |
| Garden frog | Existing `frog` records stay intact. Speckled olive/brown appearance and flatter/webbed feet; ground hops with crouch/landing and damp-shore targets. No branch perch offset or tree-seeking behavior. |
| Garden snail | Slow crawling, deliberate turns and rests, damp habitat targeting, ground-route checking, body shadow. |
| Spotted ladybug | Short crawling starts/stops, quicker turns, plant/animal avoidance, body shadow. |
| Bumblebee | Accelerated steering and hover targets above flowers, animated wings, full 3D route/volume checks. |
| Painted butterfly | Slower curved flight, wing motion, flower visits, 3D clearance and bounded altitude. |
| Little firefly | Slow wandering flight, night glow, 3D clearance and bounded altitude. |

New placement/move previews reject ground animals inside vegetation or other bodies and leave clearance at the glass. Flyers spawn at a checked clear altitude above vegetation when space permits. Existing saved positions are retained, with escape routes allowed where an old placement already overlaps.

Animal checks cover vegetation and another animal, placement clearance, pause, pet-life loss, 20x stability, relocation/path reset, vessel bounds, and finite transforms. Tests also verify the bunny against a real rotated fern's rendered bounds. Static plant bounds are shared within a frame and distant bounds are excluded from narrow route checks.

## Curved glass clearance, viewing, and bonsai trimming

The earlier trunk-only placement rule did not reserve canopy space. Plant models now have conservative height-band bounds checked against the same curved vessel profile used to render the glass. Growth, current wind tilt, rotation, raised soil, and the narrowed rim are included. Existing overlapping plants are fitted at render time; their saved coordinates, IDs, scale, growth, health, variants, and harvest progress are unchanged. New plant placement/moves reserve healthy mature canopy space. Plant bounds update before animal navigation so routes use the current foliage.

Glass-free view is saved in the world and available in Care & display and Field Guide → Your world. It disables the vessel, all three rims, and all reflection strips together. Soil, wildlife, the plinth, and growth clearance remain active. Rebuild, import, and Undo/redo honor the saved preference.

Inspecting an existing `tree` offers bounded bonsai trims and gradual regrowth. Upper branch height and canopy reach are reshaped on that tree's own geometry; lower trunk and root vertices retain their structure. Three trims hold a compact shape until Let regrow is selected. Trimming does not pay seeds, reduce health, reset maturity, remove a tree, or alter other trees. Optional `pruning`/`regrowing` entity fields preserve compatibility with untrimmed version 1/2 worlds. Growth pause and pet-life loss stop new shoots.

Evidence: `tests/bonsai.test.cjs` verifies shape limits, hold/regrowth, pause/loss, unchanged entity data, and old/new save round trips with backups. `tests/scene.test.cjs` checks every actual transformed plant vertex for all nine species and all three variants across low/high soil, central/edge legacy positions, small/oversized saved scales, seedling/full growth, rotation, and sway. It also checks isolated bonsai geometry and complete glass visibility through rebuilds. Physical-device appearance and interaction checks remain pending.

## Terrain and editing tools

| Tool | Review and result |
| --- | --- |
| Raise soil | Raises the editable vertex grid within bounded terrain heights. Invalid brush coordinates/radii do not mutate terrain. |
| Lower soil | Lowers the grid without invalid heights; edited heights survive serialization. |
| Smooth | Fixed: blends each vertex with its local neighbors from a snapshot. It now softens a peak instead of raising surrounding soil toward the brush-center height. |
| Pond | Carves a basin below the waterline, moistens nearby soil, and preserves water/terrain state on reload. |
| Remove | Removes the selected entity and uses the existing paid-seed refund rule. Removal applies to plants, decorations, and animals. |

Interrupted/cancelled terrain strokes now use the same completion path as pointer-up, preserving their edit accounting and camera restoration. Undo/redo retain the existing full-world snapshots. Keyboard changes to the sunlight slider now create Undo snapshots as pointer changes do.

## Systems and interface inventory

| Area | Evidence and result |
| --- | --- |
| Woodland / rainforest / desert | Seeded generation, distinct landforms, terrain/soil validation, and real scene creation for all three. |
| Journey / Free build | Existing costs, rewards, discoveries, harvest economy, scene limit, and unrestricted sandbox planting tested. |
| Self-sustaining / Pet Care | Same care data and mode behavior; real-time needs remain independent of simulation pause/speed. Loss, revival, switching, and old-save defaults tested. |
| Growth / weather / lighting | Independent growth rate and clock, locked day/night, seeded weather, water/soil movement, erosion, and spreading tested. |
| Inspect / move / remove / close-up | Source bindings reviewed; real scene selection, close-up/reset cameras, relocation, removal, and route reset checked. |
| Phone layout | Existing camera projection checks cover 390x844, 320x667, 430x932, and 844x390. Actual device touch ergonomics remain a manual acceptance item. |
| Audio | Existing local Web Audio synthesis retained. Toggle and hidden-tab suspend/resume bindings reviewed; listening quality is a manual check. |
| Install / ZIP download | Primary page remains the app. Get app retains PWA instructions and a ZIP link to the current main branch. Relative paths and complete offline assets tested. |
| App updates | Check on launch, foreground return, reconnection, and periodically. Ask before applying/reloading during play; Later defers the same waiting release in the current session. A waiting service worker can activate naturally after all older app windows close. Saving failure blocks activation; another tab's update asks before this tab reloads. |
| Release consistency | Added `npm run release:cache`: a fingerprint of every offline asset becomes the cache identifier. `npm run check` detects a stale fingerprint before release. |
| Graphics quality | PBR animals/glass, environment lighting, antialiasing, and existing quality modes retained. Auto adds bounded resolution adjustment under sustained slow frames and gradual recovery with sustained headroom; explicit Cinematic/Performance settings are respected. Unsupported post-processing falls back to the base renderer. |

## Rendering-engine comparison

The recommendation below is an engineering assessment for this app, not a benchmark result.

| Option | Relevant facts | Assessment for Verdant |
| --- | --- | --- |
| Babylon.js | Official specifications list WebGL/WebGPU, PBR, scene/camera/animation systems, instancing, shadows, and optimization facilities. | Keep. The required rendering capabilities already exist, and the application is built on its APIs. Better materials/assets, measured quality budgets, and coherent animation have priority over a port. |
| PlayCanvas | Official browser documentation describes WebGL 2 rendering and optional WebGPU with fallback. | Credible alternative for a new implementation. A port still needs terrain, materials, controls, and navigation integration; no measured advantage has been established here. |
| Three.js WebGPURenderer | Official documentation describes WebGPU with WebGL 2 fallback and a node/TSL material system. Custom legacy shader materials and post-processing require migration. | Strong rendering toolkit, but switching would rebuild substantial existing renderer/game integration. It is not a drop-in upgrade for this code. |
| Godot | Official web-export documentation uses WebAssembly and WebGL 2 Compatibility rendering; its Forward+/Mobile rendering paths and WebGPU are not available in current web exports. | More attractive if native app distribution becomes the main objective. For the current static browser/PWA target it does not provide an automatic graphics upgrade. |

Primary references checked October 27, 2026:

- https://www.babylonjs.com/specifications/
- https://developer.playcanvas.com/user-manual/engine/supported-browsers/
- https://threejs.org/manual/pages/webgpurenderer
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html

A Babylon WebGPU path can be investigated later with the same save format. It should be accepted only after validating the custom water shader, post-processing, offline dependencies, recovery behavior, and performance on actual target devices. This release keeps the existing WebGL backend.

## Verification and remaining acceptance work

Run before release:

```
npm run release:cache
npm run check
npm test
npm run test:scene
```

The suite covers all elements and variants, ecology/economy, care, movement/collisions, existing-save preservation/recovery, update consent, offline shell/scope isolation, adaptive graphics logic, and headless scene/camera behavior. GitHub runs the same application checks before reporting the release checks result.

Still requires actual GPU/device verification: final shader appearance and glass/water transparency; touch gestures on current iPhone/iPad and Android; actual frame rate and battery behavior in dense worlds; browser-native installation/update UX across those devices; listening to ambient audio. NullEngine checks cannot certify those properties. The app therefore has a tested code-level quality baseline, with the remaining visual and device acceptance boundary stated explicitly.
