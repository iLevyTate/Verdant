# Verdant improvement research

Reviewed October 30, 2026, against `6a82b83f85837abef520f69cd9c0dcb24fafc72d` on `main`.

This is the original research plan. The audit itself did not change production code or saved worlds. The subsequent software implementation and remaining device acceptance are recorded in [IMPLEMENTATION_4.md](IMPLEMENTATION_4.md).

## Recommendation

Keep Babylon.js and improve the content, interaction rules, and performance budgets first. The current application already has PBR surfaces, scanned maps, translucency, shadows, automatic resolution scaling, mature placement previews, configurable vessels, restore points, and consent-based updates. Recommending those features again would miss the remaining problems.

The strongest next work is: preserve device preferences across gardens; serialize competing saves; complete plant/decor spacing; measure real GPU output; reduce geometry according to screen size; then improve plant development, terrain materials, and lighting. These changes can retain the current terrain, entity identities, progression, and archived wildlife.

## Evidence and limits

The review covered the current core simulation, botanical geometry, materials, renderer, editing controls, persistence, service worker, update flow, quality notes, and test/benchmark harnesses. The GitHub branch head matched the local checkout. All 20 existing suites passed again, as did syntax and offline-fingerprint checks.

Additional probes executed the production core/storage/geometry code without changing it. They found the following:

| Probe | Result | What it establishes |
| --- | --- | --- |
| Create another garden after choosing Performance, Calm view, Glass-free, and Moonlight | New-world defaults become Auto, device motion preference, visible glass, and Daylight | Preferences are stored in each world rather than consistently retained on the device |
| Advance identical noon worlds for one second, changing only lighting mode | Growth increment was `0.0268755` with Daylight and `0.01343775` with Moonlight | A display choice changes the simulated growth rate in this fixture |
| Place a large rock 0.35 units from a mature juniper | Both core and renderer placement checks accepted it; the model bounds overlap | Clearance from glass does not imply clearance between plants and decorations |
| Inject a second save between another writer's primary read and write | Both calls reported success; the final primary contained only the first writer's later write | Compare-then-write is not an atomic concurrency guarantee |
| Count plant geometry in a 220-element phone Auto fixture | 2,889,300 referenced plant triangles; 171 plants had non-instanced geometry | Dense scenes carry substantial geometric work before shadows and post-processing |

The concurrency probe deliberately injected an interleaving in a storage adapter. It was not a simultaneous physical-browser test and does not estimate how often that race occurs. The triangle count is geometry accounting in Babylon NullEngine, not a measurement of GPU submissions, frame rate, memory residency, or heat. No new real-GPU or physical-device appearance claim is made here.

## Priorities

P1 means the next reliability or interaction work. P2 means the next visual/performance work, after baselines are available. P3 means optional expansion.

| ID | Priority | Improvement | Main code |
| --- | --- | --- | --- |
| R1 | P1 | Separate device preferences from garden state | `game.js`, `core.js`, `saves.js` |
| R2 | P1 | Serialize writes across tabs and handle storage pressure | `saves.js`, `game.js` |
| R3 | P1 | Pin assets to a release across multi-tab updates | `sw.js`, `pwa.js`, release scripts |
| R4 | P1 | Establish real GPU, lifecycle, and sustained-device acceptance | renderer instrumentation, browser/device QA |
| R5 | P1 | Add plant/decor clearance and explain constrained growth | `core.js`, `world.js` |
| R6 | P1 | Make lighting lock independent of ecology | `core.js`, `world.js` |
| R7 | P2 | Add screen-size detail, better sharing, and CPU-aware adaptation | `botany.js`, `world.js`, `graphics.js` |
| R8 | P2 | Compress GPU textures and reduce idle rendering | `graphics.js`, asset/offline pipeline |
| R9 | P2 | Model stages of growth, varied specimens, and local motion | `botany.js`, `world.js`, optional save metadata |
| R10 | P2 | Improve terrain surfaces, wetness, shorelines, and sculpt strokes | `world.js`, `graphics.js`, `game.js` |
| R11 | P2 | Improve glass, water reflections, and changing light | `graphics.js`, `world.js` |
| R12 | P2 | Add keyboard world editing and clearer history/save feedback | `game.js`, `index.html`, CSS |
| R13 | P2 | Make ecological goals fit the selected garden | `core.js`, Field Guide |
| R14 | P3 | Add named garden slots and a real photo/share export | storage/UI, photo renderer, brand assets |

## R1. Settings should have explicit scopes

`core.js:153` generates new worlds with default graphics, motion, glass, lighting, and growth options. The New world form in `game.js` carries forward vessel and play/care choices, but not those display values. Import and whole-state Undo can also replace them. The recent reload fixes work within the current world; this is a separate scope problem.

Store graphics quality, motion preference, audio preference, and desktop panel layout as device preferences. Keep terrain, shape, size, water, care, weather, and progression with each garden. Decide explicitly whether glass visibility and lighting lock are device view preferences or per-garden presentation choices, and label them accordingly. A missing device preference should inherit the existing saved value once, so the change does not erase a person's choices. Audio still needs a user gesture when the browser requires one.

Acceptance: create, import, restore, and switch gardens without losing device preferences; reload retains both scopes; Undo of a garden edit does not silently change an accessibility preference.

## R2. A verified write still needs concurrency control

`saves.js:34` reads the primary and compares it with an expected string before writing. That handles a sequential stale writer, but another writer can act between the comparison and write. The HTML standard explicitly says authors should assume there is no cross-agent locking for localStorage [S1].

Use an application-specific Web Lock around the entire read/compare/checkpoint/write operation, with a revision checked inside the lock. Use storage events or BroadcastChannel to tell another tab that its world is stale. A transactional IndexedDB store is an alternative and becomes more useful if garden slots are added [S2, S3]. Feature-detect the chosen mechanism; do not present a best-effort fallback as equivalent protection. An older app tab that does not participate in the new lock protocol must be handled during rollout.

This requires changing the save handshake, not only wrapping `setItem`: `pwa.js` currently expects a synchronous cancelable event to confirm saving. An asynchronous lock or database transaction needs an awaited result before update activation, world replacement, or vessel Apply. Continue saving during normal use and on visibility changes; a shutdown callback cannot guarantee that a new asynchronous transaction will finish.

Add a storage-health view showing persistence state, approximate origin usage, last successful save, and export. Request persistent storage in a meaningful keep/install action and report the actual result. Browser storage is best effort by default, and persistence is distinct from merely reading a successful write back [S4]. On GitHub Pages, other projects on the same origin also share origin storage constraints.

Review backup pressure separately: saving currently requires a previous-world backup write before the primary write. Prune expendable history under a defined policy before exhausting space, while retaining a valid primary and a recoverable predecessor. The history limit currently counts string characters, despite a variable named `bytes`; it is not an exact storage-byte budget. Any degraded-backup state must be visible.

Acceptance: two real tabs editing the same revision cannot both commit different successor worlds; quota failures retain recoverable data; export remains usable; no migration deletes the legacy save.

## R3. Complete the multi-tab update contract

Consent, a before-update checkpoint, complete-shell `cache.addAll` installation, and a per-release cache name are already implemented. Keep them.

The remaining concern is `sw.js:9`: activation deletes all previous release caches and claims clients. A different tab can keep older HTML/JavaScript open after `controllerchange`, while subsequent asset requests are handled by the newer worker. web.dev documents this exact lifecycle hazard [S5]. This is a code-derived risk, not a reproduced report of a user's broken update.

Use immutable, content-addressed asset URLs or a release manifest plus client/release coordination. Retain the resources an older live client needs until it closes or safely reloads. Activation in one tab must not discard another tab's unsaved edits. Keep the service-worker registration URL stable. A release fingerprint identifies a cache but does not by itself verify the bytes of every network response downloaded into it during a deployment.

Expose an app build ID, update release notes, last successful check, and download/error state. Verify the offline shell rather than equating an active registration with a currently complete cache. Test a failed download, offline update acceptance, another open tab, and a reload blocked by a save conflict.

## R4. Replace the main quality unknown with device evidence

NullEngine checks geometry and logic, but it does not compile and render the actual GPU output. The current graphics configuration also exits early under NullEngine. Real shader fallback, transparency, SSAO, anti-aliasing, texture decode, and context restoration therefore need their own acceptance tests.

Instrument CPU simulation/animation time, actual draw calls, frame-time percentiles, shader compilation, and GPU time where the browser exposes it. Babylon provides scene and engine instrumentation; unavailable GPU timing must be labelled unavailable [S6]. Average FPS alone hides stutters.

The current benchmark runs 50 frames with ten warm-up frames. Because simulation runs every sixth frame, it collects only seven post-warm-up simulation timings. Its p95 is useful as a quick diagnostic, but is not a stable sustained-performance estimate.

Use the same exported fixtures on Windows integrated graphics, Safari on an iPhone, and Chrome on a midrange Android device. Include 50/120/220 elements, 1×/20× time, rain, close-up, glass-free, vessel changes, and graphics switching. Run long enough to observe heating and frame-time drift. Provisional design targets are smooth 60 FPS desktop interaction and a stable 30 FPS mobile fallback; these are proposed targets, not achieved results.

Exercise loss/restoration through the engine's supported context observables and a controlled context-loss test. Babylon has restoration support; the application still needs recovery UI and an unchanged-world check. Also test background/resume and installed offline launches [S7]. Use isolated fixture saves rather than importing over a person's garden.

## R5. Clearance must describe the objects people see

`core.js:192` mainly separates non-animal centers by 0.19 units, or 0.33 for a new tree. `world.js:182` reserves mature room against glass; `canPlaceObject` then checks animals, which are currently disabled. Neither is a complete plant/decor overlap policy.

Use species-aware root zones and trunk/rock/log volumes. Treat solid-object intersections as blocked placement; allow plausible foliage overlap with a crowding warning or reduced growth. A full bounding box alone would reject many natural arrangements, so use a cheap spatial broad phase followed by a small number of root, branch, or volume tests. Apply the same rules to placement, relocation, and natural spreading.

Retain render-only containment for old edge-placed worlds, but explain it. When a smaller vessel or raised soil constrains existing plants, preview the affected count instead of making the visual shrink a surprise. Never silently remove or relocate older specimens.

Use consistent canopy dimensions for shade, crowding, and previews. `localConditions` currently uses a largely fixed canopy radius that does not include entity scale, while visual growth/fitting changes the actual crown size.

## R6. Lighting lock should affect the view

`core.js:67` defines `visualHour`, and `advance` uses it to calculate the daytime growth multiplier. That is why Moonlight produced half the growth of Daylight in the identical-noon probe. Display lighting also participates in the dusk discovery.

Separate ecological time from rendered time. Growth and ecological day/night conditions should use the simulation clock; the camera view can remain daylight or moonlight. Explicit sunlight intensity can continue to affect plant suitability. Review the dusk discovery text and migration so earned discoveries and rewards remain intact. Acceptance: changing only a view setting changes no simulated growth, harvest, or care outcome.

## R7. Spend geometry where it changes the image

There are quality presets, but no screen-size-based botanical LOD. The phone Auto probe used these counts for variant zero:

| Plant | Performance triangles | Phone Auto triangles | Cinematic triangles |
| --- | ---: | ---: | ---: |
| Juniper | 32,460 | 41,904 | 60,762 |
| Moss | 21,352 | 30,552 | 42,352 |
| Cactus | 16,152 | 16,872 | 19,248 |

Fine spines and shoots remain expensive even in Performance. Remove subpixel structures at a distance, preserve silhouettes and normal detail, and promote only the selected close-up specimen. Choose detail from projected size with hysteresis so it does not pop repeatedly. Use simpler shadow geometry where the difference is not visible.

Most plants get unique geometry for pruning or ground conformity. Share unchanged structure and use instance attributes or modest vertex-shader deformation for suitable repeated vegetation. Thin instances suit stable repeated objects, but have all-or-none group visibility and costlier structural edits; they are not a blanket replacement for every editable plant [S8].

LOD and shader deformation must preserve selection identity, conservative bounds, mature placement clearance, and believable ground contact. A cheaper model cannot justify modifying the saved specimen or making its visible extent disagree with picking.

`graphics.js:27` adapts resolution from total frame time, while `core.js` repeatedly scans entities for local conditions and hydrology. Cache local fields or use a small spatial index before adding worker complexity. Adapt geometry/shadow work for CPU or vertex pressure and resolution/post-processing for fill-rate pressure. Keep user-selected Cinematic stable unless the UI explicitly offers a fallback [S6, S9].

## R8. Reduce memory and unnecessary frames

Scanned textures are JPEGs. Their small download size does not mean they remain compressed in GPU memory. Trial KTX2/Basis assets with suitable normal/roughness quality, compare close-ups, and bundle the required decoder/transcoder resources for offline use. Babylon documents this distinction and supports KTX2 [S10]. Keep a tested fallback, and measure the complete download including decoders.

Calm view and pause already reduce animation, and hidden pages skip rendering. A visible paused/calm scene still renders continuously. Offer a battery mode with a frame cap and redraw-on-change when nothing is moving. Continue real-time care accounting without requiring continuous drawing. Camera changes, growth, UI framing, and water/weather changes must invalidate an idle frame [S11].

## R9. Make development and movement botanical

The current models have useful surface detail, but only three reusable variants per species. Growth mostly scales a mature form; bonsai trimming deforms the upper mesh through a single pruning factor. Neither produces the development of new leaves or selection of individual branches.

Add a few species-specific stages: fern frond emergence/unfurling; new succulent leaves at the rosette center; grass blades of different ages; flower bud/opening/spent head; mushroom cap development. Keep branch/leaf variation deterministic from stable entity identity. New optional renderer metadata must not reinterpret saved variants or regenerate terrain.

For juniper, prototype a small branch skeleton with explicit pruning and regrowth. Space-colonization and self-organizing tree research provide ways to steer branches into available space and respond to light; adapting these ideas is a design proposal, not evidence of botanical accuracy in this game [S12, S13]. A bounded staged approximation is appropriate before a full physiological model.

Replace whole-clump rocking with stem-root anchoring, delayed frond bending, and small leaf motion. Lightweight hierarchical or vertex-shader wind can work with instancing [S14]. Retain calm motion and glass-clearance envelopes, including the strongest animated bend.

## R10. Terrain should reveal local conditions

Current soil has scanned texture detail and moisture tint, but one primary ground material per biome. Moisture does not locally change material roughness. Planar surface UVs also cannot give every steep sculpted face a consistent physical texture scale.

Blend soil, mineral grit, damp earth, and organic litter using slope, height, moisture, and stable noise. Add limited triplanar mapping where stretching is visible; avoid applying its extra texture samples everywhere on mobile. Babylon's material system supports texture blending and triplanar blocks [S15, S16]. Use restrained wetness darkening plus roughness changes, soil-to-rock contact, and a narrow damp shoreline. These should read as material responses rather than decorative overlays.

Preserve the saved 3,073-point terrain field. Visual subdivision or microdetail should remain derived data. If visual displacement changes the apparent surface, picking and plant contact need the same surface or a tightly bounded offset. Do not replace saved heights with a fresh procedural landscape.

`game.js:185` applies a fixed sculpt amount per brush sample, with separate pointer and held-stroke schedules. Resample a stroke by distance and elapsed time, interpolate gaps, and expose strength/falloff. Limit expensive skirt, normal, plant-conformity, and water-bed refreshes to the affected region or a bounded cadence. Acceptance should compare equivalent strokes at different event rates and test fine sculpting on Roomy versus Compact footprints.

## R11. Improve optics after geometry and timing

Glass currently uses very low alpha, an environment texture, and fixed reflection strips; its physical thickness is not represented by the vessel geometry. Water uses bed-dependent tint and analytic sky colors rather than reflecting the actual plants. Those are deliberate approximations, and code correctness does not establish their visual quality.

Prototype a better rim/bottom thickness cue and restrained Fresnel reflection. Retain glass-free viewing. Add scene-dependent pond reflection/refraction only at a measured quality tier, with a simpler phone fallback. The existing engine supports refraction and thickness-related material controls [S17]. Avoid adding full-screen subsurface scattering as the default: the current cheaper leaf translucency is already useful.

For natural cycle lighting, move the sun direction as well as changing its color and intensity; currently `updateClimate` mainly changes intensity/color. Match environment illumination to the intended time of day. Review auto-mode anti-aliasing against fine foliage before adding sharpening or depth of field. All of these need real-GPU before/after captures using the same saved world and camera.

## R12. Complete desktop editing and accessibility

Toolbar keyboard navigation is already present. A keyboard user still needs a practical way to select a specimen in the world, choose a position, and place or move it. Add a searchable plant/decoration list, next/previous specimen navigation, labelled numeric transform controls, and an optional keyboard placement cursor. Provide clickable camera controls as an alternative to drag/pinch. W3C treats keyboard operation and non-drag pointer alternatives as separate concerns [S18, S19]. This is a targeted improvement plan, not a full accessibility conformance finding.

Add names to history entries, such as "Move fern" or "Raise soil". Current `snapshot`/`doHistory` serializes and restores the entire world, including simulation progress and preferences. A later Undo can therefore roll back more than the visible edit. Define the intended time/economy semantics before introducing command-based history, and retain full snapshots for explicit recovery.

Show the time of the last confirmed save and the garden name. Keep error/retry/export controls persistent. Add an explicit unsaved state for simulation progress if the status is intended to describe the entire latest world, without repeatedly announcing every growth tick to a screen reader. Check the interface at 200% browser zoom, with increased text, native select menus, reduced motion, and a screen reader. The previous layout pass did not certify these cases.

## R13. Make garden goals match the ecology

The diversity chapter asks for all nine plants in one world. That promotes combining moisture-loving woodland plants and dry-climate cacti. The relaxed self-sustaining mode also deliberately floors suitability, so the collection can survive combinations that would otherwise be unsuitable.

Keep relaxed play forgiving. Add coherent garden recipes and biome-specific optional goals instead of silently making old worlds more punitive. Woodland/rainforest gardens can emphasize ferns, moss, and organic floor detail; open dry gardens can emphasize succulents and mineral soil. RHS guidance distinguishes humid closed terrariums from open succulent/cactus arrangements [S20]. The game's vessels are currently open, so do not call them sealed ecosystems without adding that mechanic.

Preserve completed mission indices, discovery IDs, XP, and rewards if goals change. A future branchable journey is preferable to retroactively invalidating a completed chapter. Keep the Field Guide clear about illustrative ecology versus real plant-care advice.

## R14. Optional additions with a clear player benefit

Named garden slots would let people try different layouts without replacing their only active world. This needs a storage budget, explicit active-slot identity, per-slot revisions, and safe migration. A garden gallery should not hide backups or turn them into ordinary playable slots without consent.

Photo currently hides the interface; it does not create an image file. Add a rendered PNG download with camera presets and an optional seed caption. Capture through the renderer's supported screenshot/render-target path, with an export size limit and tested color output. Replace the earlier animal-containing social card with botanical artwork or a real game capture before promoting the plant-focused build.

## Engine decision

| Option | Relevant documented capability | Judgment for Verdant |
| --- | --- | --- |
| Babylon.js, current architecture | PBR/refraction, geometry/instances, instrumentation, WebGL and WebGPU | Best next step: improve this implementation and keep its tested save boundary |
| Babylon.js WebGPU path | Same engine family, asynchronous initialization, WebGL maintained alongside it [S21] | Worth a controlled prototype after profiling; test custom water shaders, post-processing, offline resources, and fallback. No automatic visual or speed improvement is established |
| Three.js WebGPURenderer | WebGPU backend with WebGL 2 fallback [S22] | Capable alternative, but requires porting Babylon-specific renderer/material/camera code. No project-specific benefit currently outweighs that work |
| PlayCanvas | Web backends, PBR, batching, lighting, and editor ecosystem [S23] | Consider if collaborative visual authoring becomes the main constraint; benchmark identical assets before a migration decision |
| Godot web export | WebAssembly plus WebGL 2 Compatibility renderer; current stable docs do not offer Forward+/Mobile on web [S24] | Consider for a future native/editor-centered product. It is not an established browser-graphics upgrade for this codebase |

No alternate engine was benchmarked against Verdant. These are capability comparisons and an architecture recommendation, not measured rankings. Validate API/version availability against the pinned engine before using features from current documentation.

## Data-preservation requirements for every phase

1. Read the current world. Never run `generate` as a replacement for a valid save during an app update.
2. Preserve terrain heights, soil, entity IDs/types/coordinates/variants/scale, growth, health, pruning, harvest, seeds, XP, mission/discovery state, real-time care, and archived animal records.
3. Treat mesh LOD, textures, light, water reflections, and other visual caches as derived data. Quality changes must not rewrite the simulation.
4. Introduce defaults only for missing fields. Migrate a copy, retain the original bytes and a known-good restore point, and verify a committed result before switching authority.
5. If moving to IndexedDB, import the legacy key transactionally and leave it intact. Define one authoritative revision/store; independently dual-writing two stores can create a new conflict problem. Prevent older clients from continuing incompatible writes.
6. Keep explicit user approval and a successful checkpoint before app activation. Defer when a safe save cannot be made.
7. Run old-save, current-save, future-format rejection, export/import, interrupted migration, quota, multi-tab, and rollback tests. Do not remove archived wildlife to save storage.
8. Keep real-world export available. Persistence requests, local backups, and read-back checks do not provide cross-device backup or protect against an explicit browser-data deletion.

## Suggested delivery sequence

Implement R1, R2, R5, and R6 as focused correctness changes. Include R3's multi-tab release safeguards in the storage rollout and use R4's browser/device baseline before claiming improved graphics or speed. Then tune R7/R8 using those measurements. Improve R9/R10/R11 in small visual comparisons on identical saved scenes. Finish R12/R13 with preservation tests for Undo and journey changes. Keep R14 optional.

Keep the next releases focused on the current plants, terrain, interaction rules, and verified rendering quality. Add species, animals, or heavier effects after those foundations meet the chosen quality and performance targets.

## Sources

Primary project code is identified above at the reviewed commit. External documentation was consulted October 30, 2026. The papers support modelling approaches, not claims that Verdant is already biologically realistic.

- [S1: WHATWG HTML, Web storage and concurrency](https://html.spec.whatwg.org/multipage/webstorage.html)
- [S2: MDN, Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [S3: MDN, Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [S4: MDN, Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [S5: web.dev, Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [S6: Babylon.js, Scene optimization and instrumentation](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/)
- [S7: MDN, WebGL context restoration](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event)
- [S8: Babylon.js, Thin instances and their limits](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances/)
- [S9: MDN, WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [S10: Babylon.js, KTX2 compressed textures](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/ktx2Compression)
- [S11: web.dev, Animation smoothness and idle rendering](https://web.dev/articles/smoothness)
- [S12: Runions, Lane, and Prusinkiewicz, Modeling Trees with a Space Colonization Algorithm, 2007](https://algorithmicbotany.org/papers/colonization.egwnp2007.html)
- [S13: Palubicki and colleagues, Self-organizing tree models for image synthesis, 2009](https://algorithmicbotany.org/papers/selforg.sig2009.html)
- [S14: NVIDIA GPU Gems 3, Procedural wind animations for trees](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-6-gpu-generated-procedural-wind-animations-trees)
- [S15: Babylon.js, Node Material texture blending](https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/nodeMaterial)
- [S16: Babylon.js, TriPlanar and PBR material blocks](https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/availableNodeBlocks/)
- [S17: Babylon.js, PBR refraction, translucency, and thickness](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/masterPBR/)
- [S18: W3C WAI, Keyboard operation](https://www.w3.org/WAI/WCAG22/Understanding/keyboard)
- [S19: W3C WAI, Dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
- [S20: Royal Horticultural Society, Terrariums and bottle gardens](https://www.rhs.org.uk/plants/types/houseplants/bottle-gardens-and-terrariums)
- [S21: Babylon.js, WebGPU support](https://doc.babylonjs.com/setup/support/webGPU)
- [S22: Three.js, WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html)
- [S23: PlayCanvas, Graphics](https://developer.playcanvas.com/user-manual/graphics/)
- [S24: Godot stable, Exporting for the Web](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
