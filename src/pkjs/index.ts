import Clay from "@rebble/clay";
import clayConfig from "./config";
import customClay from "./custom-clay";

new Clay(clayConfig, customClay);

Pebble.addEventListener("ready", () => {
  console.log("Hello world! - Sent from your javascript application.");
});
