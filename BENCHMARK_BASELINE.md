# Dense-scene CPU baseline

Recorded for the October 27, 2026 release work, using Node v24.22.1 and Babylon.js 8.32.0 on the development host. Run `npm run bench:scene` to repeat it.

**This uses Babylon NullEngine. It does not measure a phone GPU, actual browser frame rate, thermal behavior, or battery life.** Times vary with host load and are diagnostic observations, not acceptance thresholds or promised performance.

Each reproducible fixture contains roughly three plants per animal, all seven animal species across the population, full animation, flat soil, clear weather, and no self-seeding. Fifty rendered steps include ten warm-up steps. Simulation runs at its normal 10 Hz cadence. Medians and sample 95th percentiles are reported separately; they should not be added to infer actual device FPS. At 20× time more harvest markers become ready, increasing mesh counts.

| Elements / time | Animals / meshes | Animation ms median / p95 | Simulation tick ms median / p95 | NullEngine render ms median / p95 |
| --- | --- | --- | --- | --- |
| 50 / 1× | 13 / 223 | 1.58 / 5.94 | 0.36 / 0.47 | 3.55 / 6.61 |
| 120 / 1× | 30 / 349 | 3.93 / 6.79 | 0.54 / 0.79 | 6.76 / 9.24 |
| 220 / 1× | 55 / 537 | 7.49 / 12.20 | 1.17 / 1.28 | 7.05 / 8.43 |
| 220 / 20× | 55 / 702 | 12.84 / 14.66 | 4.33 / 5.97 | 8.24 / 9.93 |

The release caches geometric triangle coefficients for exact terrain sampling and avoids repeating the same ground-height query for every neighboring animal. The dense/fast case still carries meaningful CPU work; lowering rendering resolution alone cannot remove simulation/navigation cost. Representative phone profiling should determine any subsequent detail or navigation budget changes.

Care & display now reports live frame rate in the actual renderer. `npm run bench:scene -- --fixtures test-artifacts` additionally writes the three density worlds for manual device profiling in a separate test profile. Export existing worlds before importing test fixtures. See [MOBILE_QA.md](MOBILE_QA.md) for the device procedure and currently unverified acceptance areas.
