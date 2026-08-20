module.exports = function() {
  var clay = this;

  function sendCommand(command) {
    var response = encodeURIComponent(JSON.stringify({
      RING_WATCH: command
    }));
    var returnTo = window.returnTo || "pebblejs://close#";

    location.href = returnTo + response;
  }

  clay.on(clay.EVENTS.AFTER_BUILD, function() {
    clay.getItemById("ring-watch").on("click", function() {
      sendCommand("START");
    });

    clay.getItemById("stop-watch").on("click", function() {
      sendCommand("STOP");
    });
  });
};
