import {} from "piu/MC";
import Button from "pebble/button";

let playing = false;
let restartTimer: any;

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
};

function startTone() {
	if (playing)
		return;

	playing = Natives.marco_speaker_play() !== 0;
	console.log(playing ? "Speaker tone on" : "Speaker tone failed to start");
	status.string = playing ? "PINGING" : "READY";
	hint.string = playing ? "SELECT: STOP SOUND" : "SELECT: START SOUND";

	if (playing)
		restartTimer = setInterval(() => Natives.marco_speaker_play(), 1500);
}

function stopTone() {
	if (!playing)
		return;

	if (restartTimer !== undefined) {
		clearInterval(restartTimer);
		restartTimer = undefined;
	}

	Natives.marco_speaker_stop();
	playing = false;
	status.string = "READY";
	hint.string = "SELECT: START SOUND";
	console.log("Speaker tone off");
}

new Button({
	types: ["select"],
	onPush(down, type) {
		if (!down || type !== "select")
			return;

		if (playing)
			stopTone();
		else
			startTone();
	}
});

console.log("Marco Pebble speaker test: press SELECT to toggle the tone");
