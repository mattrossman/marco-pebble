interface PebbleReadyEvent {}


declare const Pebble: {
  addEventListener(
    event: "ready",
    callback: (event: PebbleReadyEvent) => void,
  ): void;
};
