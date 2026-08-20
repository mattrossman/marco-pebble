## Dev iteration flow

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository setup and the mise task
workflow.

After changing code, run at least `mise build`.

## Alloy and TypeScript

- Prefer Alloy watch code in `src/embeddedjs/*.ts` for new features.
- Alloy compiles TypeScript to embedded JavaScript during `pebble build`; do
  not rename generated files or add a separate watch-side JavaScript build.
- Keep phone-side PebbleKit JS in `src/pkjs/` unless a task specifically
  requires a different runtime.
- Use the Pebble `Button` API and Alloy modules where they cover the need.
- Use C only for Pebble APIs or performance-sensitive behavior unavailable
  from Alloy. Expose small, typed wrappers through Alloy FFI rather than
  moving the app back to a C-first architecture.

Useful references:

- Alloy: https://developer.repebble.com/guides/alloy/
- TypeScript example: https://github.com/Moddable-OpenSource/pebble-examples/tree/main/hellotypescript
- FFI: https://developer.repebble.com/guides/alloy/ffi/
- C SDK docs: https://developer.repebble.com/docs/c/

## Debugging

- C: `APP_LOG(APP_LOG_LEVEL_DEBUG, "msg", args)`.
- Watch TypeScript: `console.log("msg")`.
- Emulator output: use the Pebble CLI's emulator log options when needed.

## Pebble constraints

- Confirm platform availability before using a hardware API. This project
  currently targets Emery (Pebble Time 2), whose speaker powers the locator.
- Keep watch-side allocations and UI objects small; Pebble hardware has tight
  memory limits.
- Do not assume the emulator reproduces physical sensors, haptics, audio, or
  radio behavior.
- For native APIs, consult the relevant C SDK submodule page before coding and
  use platform guards when the API is not universally available.

## Code conventions

- Prefer explicit boolean conversions over clever coercion.
- Keep FFI wrappers narrow and document any platform-specific behavior.
- Keep generated files such as `build/` and `src/c/mc.ffi.c` untracked.
