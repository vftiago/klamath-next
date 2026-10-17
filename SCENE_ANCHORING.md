# Scene anchoring: what is always in frame, and why

Nothing in the city scene is hidden or culled by viewport size. The difference between objects that are
always visible (the two edge buildings, the searchlight beacon) and everything else comes down to how each
object's position is chosen at generation time.

## World-placed objects (most of the scene)

The layout generator (`src/app/_3d/City/generate.ts`) fills each depth layer across a span derived from the
visible width at that depth, plus a margin for camera moves. Within that span, buildings, roof furniture,
signs, billboards and stalls land wherever the seeded random walk puts them, in world units. The camera then
shows whatever falls inside its frustum.

So a given sign might be centered at one aspect ratio and off-screen at another. These objects are
"optional" only in the sense that no single one of them is guaranteed to be in frame.

## Viewport-anchored objects

Two objects are positioned in viewport-relative terms instead, so they track the frame across resizes. The
layout regenerates whenever the quantized viewport aspect changes, which is what keeps them anchored.

### The edge ("frame") buildings

In `generateLayer`, the nearest layer gets two extra full-height buildings. Each one's x is computed from the
visible width at that depth: its inner edge sits at half the visible width minus a fixed amount, so a set
slice of it always shows at the left and right edge of the frame, with the rest hanging off-screen. Their
width is a fraction of the visible width, clamped to a range.

The big blade signs (`FRAME_SIGNS` in `signage.ts`) hang off these buildings' inner edges, so they travel
with them.

Side effect worth knowing: on wide viewports these buildings grow deep enough to protrude past where the
stalls used to sit at a fixed depth. That is why the stall plane and shoreline are now derived from the
nearest layer's deepest front face (`layout.stallZ`, `layout.shoreZ`) rather than constants.

### The searchlight beacon

`pickSearchlight` takes the tallest non-frame building whose x lies within the central 40% of the visible
width on the second-nearest layer. The building itself is a random one, but the selection rule guarantees it
sits near the middle of the frame. The badge radius is likewise a fraction of the viewport width, clamped,
mirroring the reference.

## Pinning something else

The same trick works for any object: choose its position from the visible width (`visibleWidthAt(z,
aspect)` in `config.ts`) instead of the random walk, and it will stay where you put it relative to the frame.
