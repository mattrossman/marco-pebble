import Clay = require("@rebble/clay");
import clayConfig = require("./config");
import customClay = require("./custom-clay");

new Clay(clayConfig, customClay);

Pebble.addEventListener("ready", () => {
  console.log("Hello world! - Sent from your javascript application.");
});
