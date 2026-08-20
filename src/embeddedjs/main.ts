import {} from "piu/MC";
import Button from "pebble/button";
import Message from "pebble/message";

let playing = false;
let restartTimer: any;
let lightTimer: any;
let finishing = false;

const backlightColors = [
	0x00ff0055,
	0x0000ffff,
	0x00ff00ff,
	0x00ff5500,
	0x00ff00aa,
	0x00aa00ff
];

const backgroundSkin = new Skin({ fill: "black" });
const titleStyle = new Style({
	font: "bold 18px Gothic",
	color: "white",
	horizontal: "center",
	vertical: "middle"
});
const statusStyle = new Style({
	font: "bold 28px Gothic",
	color: "white",
	horizontal: "center",
	vertical: "middle"
});
const hintStyle = new Style({
	font: "14px Gothic",
	color: "white",
	horizontal: "center",
	vertical: "middle"
});

const title = new Label(null, {
	top: 28,
	left: 0,
	right: 0,
	height: 30,
	string: "MARCO PEBBLE",
	style: titleStyle
});
const status = new Label(null, {
	top: 78,
	left: 0,
	right: 0,
	height: 42,
	string: "READY",
	style: statusStyle
});
const hint = new Label(null, {
	bottom: 28,
	left: 0,
	right: 0,
	height: 24,
	string: "SELECT: START SOUND",
	style: hintStyle
});

const application = new Application(null, {
	skin: backgroundSkin
});
application.add(title);
application.add(status);
application.add(hint);

declare const Natives: {
	marco_speaker_play(): number;
	marco_speaker_stop(): void;
	marco_launched_from_phone(): number;
	marco_light_set_color_rgb888(rgb: number): void;
};

function setBacklightColor(index: number) {
	Natives.marco_light_set_color_rgb888(backlightColors[index % backlightColors.length]);
	watch.light(true);
}

function startBacklight() {
	if (lightTimer !== undefined)
		return;

	let colorIndex = 0;
	setBacklightColor(colorIndex);
	lightTimer = setInterval(() => {
		colorIndex += 1;
		setBacklightColor(colorIndex);
	}, 1000);
}

function stopBacklight() {
	if (lightTimer !== undefined) {
		clearInterval(lightTimer);
		lightTimer = undefined;
	}

	watch.light(false);
}

function startTone() {
	if (playing || finishing)
		return;

	playing = Natives.marco_speaker_play() !== 0;
	console.log(playing ? "Speaker tone on" : "Speaker tone failed to start");
	status.string = playing ? "PINGING" : "READY";
	hint.string = playing ? "PRESS ANY BUTTON WHEN FOUND" : "WAITING FOR PHONE";

	if (playing) {
		restartTimer = setInterval(() => Natives.marco_speaker_play(), 1500);
		startBacklight();
	}
}

function stopTone() {
	if (restartTimer !== undefined) {
		clearInterval(restartTimer);
		restartTimer = undefined;
	}

	Natives.marco_speaker_stop();
	playing = false;
	stopBacklight();
	status.string = "READY";
	hint.string = "WAITING FOR PHONE";
	console.log("Speaker tone off");
}

function acknowledgeFound() {
	if (finishing)
		return;

	finishing = true;
	stopTone();
	status.string = "YOU FOUND ME!";
	hint.string = "SEE YOU SOON";
	setBacklightColor(0);
	setTimeout(() => {
		stopBacklight();
		watch.exit();
	}, 1500);
}

new Button({
	types: ["back", "up", "down", "select"],
	onPush(down, type) {
		if (!down || finishing)
			return;

		acknowledgeFound();
	}
});

let incomingMessage: Message;
incomingMessage = new Message({
	keys: ["RING_WATCH"],
	onReadable() {
		const message = incomingMessage.read();
		const action = message.get("RING_WATCH");
		if (action === "START")
			startTone();
		else if (action === "STOP")
			stopTone();
	}
});

if (Natives.marco_launched_from_phone() !== 0)
	startTone();

console.log("Marco Pebble locator: start and stop from the phone");
