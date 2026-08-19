const Clay = require("@rebble/clay");
const clayConfig = require("./config");

new Clay(clayConfig);

Pebble.addEventListener("ready",
    function(e) {
        console.log("Hello world! - Sent from your javascript application.");
    }
);
