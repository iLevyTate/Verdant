# Mobile release acceptance

Automated checks cover logic, real model geometry, offline assets, and production DOM event handlers. Physical Android/iPhone GPU, touch feel, thermal behavior, battery, native installation, and actual browser layout are **not certified by the headless environment**.

## Repeatable device procedure

1. Export the current world from Care & display before testing. Use a separate browser profile for destructive test scenarios; keep the exported file outside browser storage.
2. Open the published HTTPS app at phone portrait and landscape sizes. Confirm the initial garden fits, the tray scrolls, and Care/inspector/backup panels remain scrollable with readable controls.
3. Inspect the bunny, a mature juniper, flowers, a snail, and a flyer. Close-up should frame the complete selected model. Reset must restore the complete terrarium.
4. Place and move plants/decorations near animals. Placement should reject an occupied mature footprint; new animals should not start inside vegetation or on wet/steep ground. Sculpt a small hill and watch ground contact.
5. Trim a bonsai three times, Undo/Redo, choose Let regrow, save, reload, and export/import. Verify its ID, position, health, harvest state, and chosen trim survive.
6. Toggle Glass-free view, mature previews, and Calm view. Reload and confirm the choices persist. Compare automatic reduced motion with the device preference. Growth/care clocks must continue in Calm view.
7. Create several restore points, edit the garden, then restore an earlier point. Confirm the displaced world is still available and Undo restores the session's prior arrangement. Verify export works from Care and the warning banner.
8. In a test profile, induce a storage failure/conflict. The warning must persist after its toast disappears. Export must work. Retry must clear the banner only when saving succeeds; conflicting saves must not overwrite another tab.
9. With an older installed release open, publish a newer release. Check for updates, choose Later, then reopen it from the persistent Update button. Save & update now must keep the same world and progress. Test save failure, offline checks, returning online, and another tab activating the update. First installation must not ask to update.
10. Verify native installation and offline reopening in supported Android and iPhone browsers. Wait for offline readiness before disconnecting.

## Density and performance

`npm run bench:scene -- --fixtures test-artifacts` writes reproducible 50-, 120-, and 220-element worlds and reports CPU-only timings. Import those fixtures in the separate test profile. Record the device, browser, release, viewport, and settings.

For each density, run 1× and 20× time for at least 60 seconds in Auto and Performance, then test Cinematic where practical. Use Care's live FPS display and browser profiling to separate animation/simulation work from GPU work. Record median frame rate, long stutters, responsiveness while orbiting/sculpting, and behavior after returning from the background. Include a ten-minute heat/battery observation for sustained play.

Targets for tuning: prefer a steady 60 FPS where the device has headroom; keep a playable 30 FPS target on constrained phones. These are acceptance goals, not measured guarantees. Change detail/shadow/navigation budgets based on those measurements rather than inferring phone performance from NullEngine results.
