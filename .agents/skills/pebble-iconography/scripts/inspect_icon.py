#!/usr/bin/env python3
"""Print a binary Pebble icon grid and basic optical-alignment metrics."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


PIXEL_RE = re.compile(r"^(\d+),(\d+): \((\d+)\)")


def read_alpha(path: Path) -> list[list[bool]]:
    result = subprocess.run(
        ["magick", str(path), "-alpha", "extract", "txt:-"],
        check=True,
        capture_output=True,
        text=True,
    )
    width = height = None
    pixels: dict[tuple[int, int], bool] = {}

    for line in result.stdout.splitlines():
        if line.startswith("# ImageMagick pixel enumeration:"):
            match = re.search(r"enumeration: (\d+),(\d+),", line)
            if match:
                width, height = map(int, match.groups())
            continue
        match = PIXEL_RE.match(line)
        if match:
            x, y, alpha = map(int, match.groups())
            pixels[x, y] = alpha > 0

    if width is None or height is None:
        raise ValueError("could not read image dimensions from ImageMagick")
    if len(pixels) != width * height:
        raise ValueError("ImageMagick returned an incomplete pixel grid")
    return [[pixels[x, y] for x in range(width)] for y in range(height)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("png", type=Path)
    parser.add_argument(
        "--require-symmetric",
        action="store_true",
        help="fail unless the raster is exactly mirrored horizontally and vertically",
    )
    args = parser.parse_args()
    grid = read_alpha(args.png)
    height = len(grid)
    width = len(grid[0])
    occupied = [(x, y) for y, row in enumerate(grid) for x, on in enumerate(row) if on]

    if not occupied:
        raise ValueError("icon contains no opaque pixels")

    xs, ys = zip(*occupied)
    centroid_x = sum(xs) / len(xs)
    centroid_y = sum(ys) / len(ys)
    center_x = (width - 1) / 2
    center_y = (height - 1) / 2
    horizontal_mismatch = sum(
        grid[y][x] != grid[y][width - 1 - x]
        for y in range(height)
        for x in range(width // 2)
    )
    vertical_mismatch = sum(
        grid[y][x] != grid[height - 1 - y][x]
        for y in range(height // 2)
        for x in range(width)
    )

    print(f"size: {width}x{height}")
    print(f"opaque pixels: {len(occupied)}")
    print(f"bounding box: x={min(xs)}..{max(xs)}, y={min(ys)}..{max(ys)}")
    print(f"centroid: ({centroid_x:.2f}, {centroid_y:.2f})")
    print(f"centroid offset: ({centroid_x - center_x:+.2f}, {centroid_y - center_y:+.2f})")
    print(f"mirror mismatches: horizontal={horizontal_mismatch}, vertical={vertical_mismatch}")
    print("grid (#=opaque, .=transparent):")
    for y, row in enumerate(grid):
        print(f"{y:02d} " + "".join("#" if on else "." for on in row))
    if args.require_symmetric and (horizontal_mismatch or vertical_mismatch):
        raise ValueError(
            "icon is not symmetric: "
            f"horizontal={horizontal_mismatch}, vertical={vertical_mismatch}"
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"inspect_icon.py: {error}", file=sys.stderr)
        raise SystemExit(1)
