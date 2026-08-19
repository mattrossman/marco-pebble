module.exports = [
  {
    type: "heading",
    defaultValue: "Marco Pebble"
  },
  {
    type: "text",
    defaultValue: "Use this page to call your Pebble when it is nearby."
  },
  {
    type: "section",
    items: [
      {
        type: "button",
        messageKey: "RING_WATCH",
        id: "ring-watch",
        primary: true,
        defaultValue: "Ping my Pebble",
        description: "Tap this, then save to play the chime."
      }
    ]
  },
  {
    type: "submit",
    defaultValue: "Save & Ping"
  }
];
