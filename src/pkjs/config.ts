import type Clay from "@rebble/clay";

type ClayConfigItem = Clay.ClayConfigItem;

interface MarcoClayConfigItem extends Omit<ClayConfigItem, "items"> {
  primary?: boolean;
  description?: string;
  items?: MarcoClayConfigItem[];
}

const clayConfig: MarcoClayConfigItem[] = [
  {
    type: "heading",
    defaultValue: "Marco Pebble",
  },
  {
    type: "text",
    defaultValue: "Start or stop the chime from your phone.",
  },
  {
    type: "section",
    items: [
      {
        type: "button",
        id: "ring-watch",
        primary: true,
        defaultValue: "Ping my Pebble",
        description: "Start the chime and light show.",
      },
      {
        type: "button",
        id: "stop-watch",
        defaultValue: "Stop pinging",
        description: "Silence the watch if you are not ready to find it.",
      },
    ],
  },
];

export = clayConfig;
