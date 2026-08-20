const Clay = require("@rebble/clay");
const clayConfig = require("./config");
const customClay = require("./custom-clay");

new Clay(clayConfig, customClay);

Pebble.addEventListener("ready",
    function(e) {
        console.log("Hello world! - Sent from your javascript application.");
    }
);
