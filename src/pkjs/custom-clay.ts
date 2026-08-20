import type Clay from "@rebble/clay";

type ClayConfig = Clay.ClayConfig;

const customClay = function (this: ClayConfig): void {
  const clay = this;

  function sendCommand(command: "START" | "STOP"): void {
    const response = encodeURIComponent(JSON.stringify({ RING_WATCH: command }));
    const returnTo = (window as Window & { returnTo?: string }).returnTo ||
      "pebblejs://close#";

    location.href = returnTo + response;
  }

  clay.on(clay.EVENTS.AFTER_BUILD, () => {
    clay.getItemById("ring-watch").on("click", () => {
      sendCommand("START");
    });

    clay.getItemById("stop-watch").on("click", () => {
      sendCommand("STOP");
    });
  });
};

export default customClay;
