---
name: pebble
description: Build and research Pebble apps using Alloy/TypeScript, PebbleKit JS, and the C SDK/FFI when needed
---

# Pebble Development Skill

## When to use this skill

Use this skill for Pebble watchfaces, watchapps, Alloy projects, PebbleKit JS,
Pebble C SDK code, or platform-specific Pebble behavior.

## Project defaults

This repository prefers Alloy with TypeScript for watch-side code:

- Watch code belongs in `src/embeddedjs/*.ts`.
- Phone-side code belongs in `src/pkjs/`.
- The Alloy build invokes TypeScript automatically for embeddedjs sources.
- Use C through Alloy FFI when an API is not exposed by Alloy, such as the
  Pebble Speaker API. Keep the native wrapper small and expose only the needed
  functions.
- Use the repository's `mise` tasks; they activate the pinned Pebble SDK and
  CLI automatically.

## Documentation lookup

Primary docs: https://developer.repebble.com

Read the relevant authoritative page before using an API whose signature or
platform support is uncertain:

- Alloy overview: https://developer.repebble.com/guides/alloy/
- Alloy getting started: https://developer.repebble.com/guides/alloy/getting-started/
- Alloy TypeScript example: https://github.com/Moddable-OpenSource/pebble-examples/tree/main/hellotypescript
- Alloy FFI: https://developer.repebble.com/guides/alloy/ffi/
- Alloy sensors and buttons: https://developer.repebble.com/guides/alloy/sensors-and-input/
- Alloy networking: https://developer.repebble.com/guides/alloy/networking/
- C SDK index: https://developer.repebble.com/docs/c/
- Hardware matrix: https://developer.repebble.com/guides/tools-and-resources/hardware-information/

If the RePebble page is unavailable, try the community mirror:
https://developer.rebble.io

For C APIs, fetch the complete submodule page rather than relying on a symbol
anchor. C paths follow:

`https://developer.repebble.com/docs/c/{Module}/{Submodule}/`

Examples:

- Speaker: https://developer.repebble.com/docs/c/User_Interface/Speaker/
- Buttons: https://developer.repebble.com/docs/c/User_Interface/Clicks/
- App messages: https://developer.repebble.com/docs/c/Foundation/AppMessage/
- Platform macros: https://developer.repebble.com/docs/c/Foundation/Platform/

## Implementation guidance

- Prefer documented Alloy APIs over handwritten C.
- Prefer TypeScript for new embeddedjs code; add local declarations only when
  generated FFI typings are not available.
- Keep `src/pkjs/index.js` compatible with the PebbleKit JS runtime and use it
  for phone networking, location, and app-message handling.
- For FFI, update all three pieces together: the C wrapper, the `ffi` block in
  `src/embeddedjs/manifest.json`, and the `Natives` declaration/call site.
- Check the API's platform availability before expanding `targetPlatforms`.
- When testing audio, haptics, sensors, or Bluetooth behavior, distinguish a
  successful build/emulator install from a real hardware test.

## Verification

After code changes, run:

```sh
mise build
```

For a clean build and Emery emulator install:

```sh
mise install-emulator
```

Use `mise rebuild` when generated Moddable or Pebble build artifacts may be
stale. Cite the relevant Pebble docs URL when explaining SDK behavior or
platform limitations.
