---
name: pebble-iconography
description: Design, render, and iterate Pebble watch-app icons using Pebble's iconography style and pdc_tool. Use when drafting a 25x25 menu icon, preparing Pebble app icon assets, or reviewing icon concepts with a human.
---

# Pebble iconography

Use the Pebble iconography repository and its style guide as the visual source
of truth:

- Repository: https://github.com/pebble-dev/iconography
- Style guide: https://github.com/pebble-dev/iconography/blob/master/STYLE-GUIDE.md
- Renderer: https://github.com/HBehrens/pdc_tool

## Workflow

1. Translate the desired concept into one sentence before drawing. Choose the
   simplest recognizable visual language for that concept instead of adding
   literal details by default.
2. Create or edit the SVG source in `assets/icons/`. Use whole-pixel or
   half-pixel geometry, a small number of bold shapes, and no text or details
   that cannot survive 25x25 pixels.
3. Render the exact B&W preview with `pdc_tool`:

   ```sh
   mise exec -- pdc_tool assets/icons/icon.svg png --platform aplite \
     --background-color white --crop 0 /tmp/icon-pdc.png
   ```

   `pdc_tool` otherwise renders onto a 144x168 platform canvas. `--crop 0`
   produces the SVG's 25x25 bounds for icon review.
4. Inspect the raster at pixel level before making alignment claims:

   ```sh
   python3 .agents/skills/pebble-iconography/scripts/inspect_icon.py \
     /tmp/icon-pdc.png --require-symmetric
   ```

   Use the reported centroid, bounding box, and horizontal/vertical mirror
   mismatch counts to distinguish true geometric imbalance from optical
   imbalance. Use `--require-symmetric` only when the icon is intended to be
   symmetric. Always inspect the ASCII grid when a detail looks shifted.
5. Make an enlarged nearest-neighbor review image for human inspection:

   ```sh
   mkdir -p assets/icons/preview
   magick /tmp/icon-pdc.png -resize 1000% -filter point \
     assets/icons/preview/icon-large.png
   ```

6. Show the exact 25x25 PNG and enlarged preview. Ask for feedback on concept,
   silhouette, balance, symmetry, spacing, circularity, contrast, and
   recognizability before wiring the asset into the Pebble manifest.
7. Revise the SVG, rerender, and repeat. Treat the SVG as the source of truth;
   do not hand-edit the rendered preview.
8. When approved, create the committed launcher resource:

   ```sh
   mise exec -- pdc_tool assets/icons/icon.svg png --platform aplite \
     --background-color white --crop 0 /tmp/icon-pdc.png
   magick /tmp/icon-pdc.png -transparent white resources/menu-icon.png
   ```

   Register `resources/menu-icon.png` as a 25x25 `bitmap` with `menuIcon: true`
   in `package.json`. Commit the SVG source and this PNG resource. Keep
   enlarged previews under `assets/icons/preview/`; they are review artifacts,
   not app resources.

9. Build and install the approved resource using the repository's normal
   Pebble workflow, then review it in the launcher on the target emulator or
   physical watch.

   ```sh
   mise build
   ```

## Completion gate

Do not present an icon as finished, wire it into the manifest, or install it
for final review until all applicable checks pass:

- `pdc_tool` emits no warnings about unsupported curves, stroke widths, or
  coordinates.
- The exact 25x25 raster has been inspected with the ASCII grid and metrics.
- Symmetric concepts pass `inspect_icon.py --require-symmetric`; intentionally
  asymmetric concepts have a documented reason for their measured offset.
- The rendered PNG has the expected dimensions, alpha behavior, and committed
  resource path.
- The project build succeeds for every target platform.
- The exact resource has been reviewed by a human in the launcher or on a
  target watch. Treat visual feedback as a new draft cycle, not as approval of
  an unverified intermediate.

## Constraints

- Prefer permitted Pebble angles and simple pixel-snapped geometry.
- At 25x25, use 2px solid strokes. Favor horizontal, vertical, 1:1, 2:1, and
  3:1 stair-step angles; avoid arbitrary slopes that rasterize unevenly.
- Snap points to pixels or half-pixels according to stroke width. Use even
  stroke widths on grid lines and odd stroke widths centered on pixels.
- Prefer closed shapes with a filled white focal area; reserve open lines for
  motion or secondary elements.
- Use equal visual padding and check both vertical and horizontal centering.
- Use the fewest repeated elements that communicate the concept at 25x25;
  reduce count when spacing collapses or forms merge.
- Make curved forms visibly circular. Prefer mirrored, multi-point polylines
  over bracket-like shapes; Bézier curves are approximated by `pdc_tool` and
  can introduce unexpected rasterization.
- Center the visual mass on the canvas axis. Size center marks and other small
  details based on the rendered result, since thin or tiny shapes can change
  character after rasterization.
- Avoid thin strokes, accidental Bézier-heavy curves, tiny text, and details
  that turn into blobs or ambiguous symbols.
- Test the final icon in both its exact 25x25 form and in the launcher context.
