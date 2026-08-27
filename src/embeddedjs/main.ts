import {} from "piu/MC";
import Button from "pebble/button";
import Message from "pebble/message";

let playing = false;
let phoneRinging = false;
let phoneStopRequested = false;
let pendingPhoneCommand: "START" | "STOP" | undefined;
let phoneMessageWritable = false;
let phoneRequestTimer: any;
let restartTimer: any;
let lightTimer: any;
let finishing = false;

const backlightColors = [
	0x00ff0055,
	0x0000ffff,
	0x00ff00ff,
	0x00ff5500,
	0x00ff00aa,
	0x00aa00ff,
	0x00ffffff
] as const;

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
const connectionStyle = new Style({
	font: "14px Gothic",
	color: "white",
	horizontal: "center",
	vertical: "middle"
});

const connection = new Label(null, {
	top: 4,
	left: 0,
	right: 0,
	height: 18,
	string: "● DISCONNECTED",
	style: connectionStyle
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
	string: "WAITING FOR PHONE",
	style: hintStyle
});

const application = new Application(null, {
	skin: backgroundSkin
});
application.add(title);
application.add(status);
application.add(hint);
application.add(connection);

declare const Natives: {
	marco_speaker_play(): number;
	marco_speaker_stop(): void;
	marco_launched_from_phone(): number;
	marco_light_set_color_rgb888(rgb: number): void;
};

const message = new Message({
	keys: ["RING_WATCH", "RING_PHONE", "PHONE_STATE"],
	onReadable() {
		const incoming = message.read();
		const action = incoming.get("RING_WATCH");
		const phoneState = incoming.get("PHONE_STATE");
		if (action === "START")
			startTone();
		else if (action === "STOP")
			stopTone();

		if (phoneState === "REQUEST_RECEIVED") {
			status.string = "SENDING";
			hint.string = "WAITING FOR PHONE";
		} else if (phoneState === "RINGING") {
			if (phoneRequestTimer !== undefined) {
				clearTimeout(phoneRequestTimer);
				phoneRequestTimer = undefined;
			}
			if (phoneStopRequested) {
				sendPhoneCommand("STOP");
				return;
			}
			phoneRinging = true;
			status.string = "PHONE RINGING";
			hint.string = "PRESS SELECT TO STOP";
		} else if (phoneState === "STOPPED") {
			if (phoneRequestTimer !== undefined) {
				clearTimeout(phoneRequestTimer);
				phoneRequestTimer = undefined;
			}
			phoneStopRequested = false;
			phoneRinging = false;
			status.string = "CANCELLED";
			hint.string = "PHONE ALERT STOPPED";
		} else if (phoneState === "FAILED") {
			if (phoneRequestTimer !== undefined) {
				clearTimeout(phoneRequestTimer);
				phoneRequestTimer = undefined;
			}
			phoneStopRequested = false;
			phoneRinging = false;
			status.string = "PHONE ERROR";
			hint.string = "PHONE ALERT FAILED";
		}
	},
	onWritable() {
		phoneMessageWritable = true;
		if (pendingPhoneCommand === undefined)
			return;

		const command = pendingPhoneCommand;
		pendingPhoneCommand = undefined;
		message.write(new Map([["RING_PHONE", command]]));
		console.log(`Phone command sent: ${command}`);
	},
	onSuspend() {
		phoneMessageWritable = false;
		console.log("Phone messages suspended");
	}
});

function updateConnection() {
	const connected = watch.connected.pebblekit;
	connection.string = connected ? "● CONNECTED" : "● DISCONNECTED";
	if (phoneRinging || playing)
		return;

	if (connected) {
		status.string = "READY";
		hint.string = "PRESS SELECT TO FIND PHONE";
	} else {
		status.string = "NO PHONE";
		hint.string = "OPEN PEBBLE APP TO CONNECT";
	}
}

function sendPhoneCommand(command: "START" | "STOP") {
	pendingPhoneCommand = command;
	if (phoneMessageWritable) {
		const pending = pendingPhoneCommand;
		pendingPhoneCommand = undefined;
		message.write(new Map([["RING_PHONE", pending]]));
		console.log(`Phone command sent: ${pending}`);
	}
}

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
	if (playing) {
		status.string = "PINGING";
		hint.string = "PRESS ANY BUTTON WHEN FOUND";
	} else {
		updateConnection();
	}

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

function startPhoneSearch() {
	if (phoneRinging || phoneStopRequested)
		return;

	if (!watch.connected.pebblekit) {
		connection.string = "● DISCONNECTED";
		status.string = "NO PHONE";
		hint.string = "OPEN PEBBLE APP TO CONNECT";
		console.log("Select ignored: PebbleKit JS is disconnected");
		return;
	}

	phoneRinging = true;
	phoneStopRequested = false;
	status.string = "SENDING";
	hint.string = "WAITING FOR PHONE";
	sendPhoneCommand("START");
	phoneRequestTimer = setTimeout(() => {
		phoneRequestTimer = undefined;
		if (!phoneRinging) return;
		phoneRinging = false;
		status.string = "PHONE ERROR";
		hint.string = "PHONE ALERT FAILED";
	}, 3000);
}

function cancelPhoneSearch() {
	if (!phoneRinging && !phoneStopRequested)
		return;

	phoneStopRequested = true;
	phoneRinging = false;
	status.string = "STOPPING";
	hint.string = "CANCELLING PHONE ALERT";
	sendPhoneCommand("STOP");
	setTimeout(() => {
		if (!phoneStopRequested) return;
		phoneStopRequested = false;
		status.string = "CANCELLED";
		hint.string = "PHONE ALERT STOPPED";
	}, 1000);
}

new Button({
	types: ["back", "up", "down", "select"],
	onPush(down, type) {
		if (!down || finishing)
			return;

		if (type === "select") {
			if (playing)
				acknowledgeFound();
			else if (phoneRinging || phoneStopRequested)
				cancelPhoneSearch();
			else
				startPhoneSearch();
			return;
		}

		if (playing)
			acknowledgeFound();
	}
});

watch.addEventListener("connected", updateConnection);
updateConnection();

if (Natives.marco_launched_from_phone() !== 0)
	startTone();

console.log("Marco Pebble locator: start and stop from the phone");
