# Neon city: project state

Broad strokes of where the city scene is and where it's going. Details live in the code comments, in
`CLAUDE.md` (architecture reference) and in the gitignored `.tasks/` plans; this file is the map.

## Where things are

| Branch                           | Contents                                                                                                                         | Status                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `master`                         | The site without the city                                                                                                        | production                 |
| `feature/neon-city-scene`        | The layered city: buildings, signs, billboards, beacon, stalls (sprites), fog, river, rain, quality tiers, aerial test cameras   | the baseline; PR candidate |
| `feature/city-depth-experiments` | Off the baseline: ground plane, deeper layers with back rows and streets, box-built stalls with volumetric glow, animated people | experimental, unpushed     |
| `feature/city-grid` (not yet)    | A true 3D block grid replacing the parallax layers                                                                               | planned                    |

The baseline is faithful to the nanodrops reference: six parallax layers of façades seen level from the
river, with a vertical lens shift instead of a pitched camera. Everything on the experiments branch
exists to make the city hold up from other angles; whether it ships is an open decision.

## What the experiments branch adds, in order

1. A dark ground plane under the whole city (the river used to run under everything).
2. Per-building depth, a staggered back row per layer, and street gaps every few buildings. Depth caps
   keep roofs clear of the fog planes.
3. The river trimmed to the shoreline (it z-fought the ground from far cameras); pavement merged into the
   ground plane.
4. Stalls rebuilt as boxes (kitchen block, posts, counter, sloped striped or signboard roofs) with painted
   details, bulbs, and volumetric glow spheres for the stall and its lanterns. Tuning in `STALL`.
5. People: procedural silhouettes (five body types, walk cycle, umbrellas, seated pose) simulated on the
   CPU, walking two lanes, pausing, and sitting at stall stools. Tuning in `PEOPLE`, count per quality tier.

Each step is its own commit, so any of them can be cherry-picked onto the baseline on its own.

## Decisions taken

- The city stays procedural and seeded; no assets beyond the logo.
- Tuning knobs are gathered into plain objects in `src/app/_3d/City/config.ts` (`CAMERA`, `LAYERS`,
  `STALL`, `PEOPLE`, block-depth and street constants). New features follow the same pattern.
- The aerial route cameras in `ThreeScene.tsx` are a testing aid (marked `TESTING`) and get re-tuned or
  reverted before shipping.
- The legacy scene (`src/app/_3d/legacy/`) stays unmounted until the city is approved, then goes in its
  own commit.

## Open questions

- Layered city with depth (experiments branch) vs. a real block grid (`.tasks/city-depth-experiments.md`,
  part B). The grid fixes the far layers' giant world scale from above; the layered version keeps the
  reference look from the front at a fraction of the work.
- Lens: a narrower FOV with the camera pulled back would calm the perspective at the frame edges (and
  show less of building sides) without changing what's in frame; it also compresses depth.
- Whether the people and the stall rebuild are worth their cost in the front view, which is the view
  that ships.

## Next

- Decide on the experiments branch: adopt, cherry-pick parts, or shelve. If adopting, open it as a PR
  stacked on `feature/neon-city-scene`.
- Re-tune the route cameras for the chosen city.
- Scene tuning menu (`.tasks/scene-tuning-menu.md`): a side panel to edit the config blocks live. Needs
  the quality probe to ignore rebuild stalls first.
- Remove the legacy scene once approved.

## How to look at it

- `pnpm dev`, then `/` for the shipping view; `/projects`, `/about`, `/repositories` for the aerial
  test cameras.
- `?quality=full|reduced|static` forces a tier (the probe may otherwise step down after a hot reload and
  remember it for the tab session; `?debug=1` shows the tier, frame time and draw calls).
- Rain toggle top right; `prefers-reduced-motion` disables the canvas entirely.

## Related notes

- `CLAUDE.md`: directory map, patterns, and the constraints the code follows.
- `SCENE_ANCHORING.md`: what is viewport-anchored (frame buildings, searchlight) and why.
- `.tasks/` (gitignored): `neon-city-scene.md` (the original build plan and reference spec),
  `city-depth-experiments.md`, `people.md`, `scene-tuning-menu.md`.
