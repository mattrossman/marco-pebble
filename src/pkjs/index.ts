import Clay from "@rebble/clay";
import clayConfig from "./config";
import customClay from "./custom-clay";

new Clay(clayConfig, customClay);

type PhoneCommand = "START" | "STOP";
type PhoneState = "REQUEST_RECEIVED" | "RINGING" | "STOPPED" | "FAILED";

interface PhoneMessage {
	RING_PHONE?: PhoneCommand;
}

const melody = [
	{ frequency: 880, duration: 180 },
	{ frequency: 988, duration: 180 },
	{ frequency: 1175, duration: 240 },
	{ frequency: 988, duration: 180 },
	{ frequency: 880, duration: 360 },
] as const;

let audioContext: AudioContext | undefined;
let loopTimer: number | undefined;
let startTimer: number | undefined;

function sendPhoneState(state: PhoneState): void {
	Pebble.sendAppMessage(
		{ PHONE_STATE: state },
		() => console.log(`Phone state sent: ${state}`),
		(error) =>
			console.log(`Phone state failed: ${state} ${JSON.stringify(error)}`),
	);
}

function stopPhoneAlert(): void {
	if (startTimer !== undefined) {
		clearTimeout(startTimer);
		startTimer = undefined;
	}

	if (loopTimer !== undefined) {
		clearTimeout(loopTimer);
		loopTimer = undefined;
	}

	if (audioContext !== undefined) {
		void audioContext.close();
		audioContext = undefined;
	}
}

function scheduleMelody(): void {
	if (audioContext === undefined) return;

	const startTime = audioContext.currentTime + 0.05;
	let offset = 0;

	for (const note of melody) {
		const oscillator = audioContext.createOscillator();
		const gain = audioContext.createGain();
		const noteStart = startTime + offset;
		const noteEnd = noteStart + note.duration / 1000;

		oscillator.type = "sine";
		oscillator.frequency.value = note.frequency;
		gain.gain.setValueAtTime(0, noteStart);
		gain.gain.linearRampToValueAtTime(0.95, noteStart + 0.02);
		gain.gain.setValueAtTime(0.95, noteEnd - 0.04);
		gain.gain.linearRampToValueAtTime(0, noteEnd);
		oscillator.connect(gain);
		gain.connect(audioContext.destination);
		oscillator.start(noteStart);
		oscillator.stop(noteEnd);

		offset += note.duration / 1000 + 0.04;
	}

	loopTimer = setTimeout(scheduleMelody, offset * 1000 - 40);
}

function startPhoneAlert(): void {
	stopPhoneAlert();

	try {
		const audioContextConstructor = (window.AudioContext ||
			(window as Window & { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext) as typeof AudioContext | undefined;
		console.log(
			`Phone START received; AudioContext=${typeof audioContextConstructor}`,
		);

		if (audioContextConstructor === undefined)
			throw new Error("AudioContext is unavailable");

		audioContext = new audioContextConstructor();
		console.log(`Phone audio context created: ${audioContext.state}`);
		startTimer = setTimeout(() => {
			startTimer = undefined;
			if (audioContext === undefined) return;

			const activate = () => {
				try {
					if (audioContext === undefined) return;
					console.log(`Phone audio context ready: ${audioContext.state}`);
					scheduleMelody();
					console.log("Phone melody scheduled");
					sendPhoneState("RINGING");
				} catch (error) {
					console.log(`Phone melody failed: ${JSON.stringify(error)}`);
					stopPhoneAlert();
					sendPhoneState("FAILED");
				}
			};

			try {
				if (audioContext.state !== "suspended") {
					activate();
					return;
				}

				const resumed = audioContext.resume();
				if (resumed && typeof resumed.then === "function") {
					void resumed.then(activate).catch((error) => {
						console.log(`Phone audio resume failed: ${JSON.stringify(error)}`);
						stopPhoneAlert();
						sendPhoneState("FAILED");
					});
				} else {
					activate();
				}
			} catch (error) {
				console.log(`Phone audio resume failed: ${JSON.stringify(error)}`);
				stopPhoneAlert();
				sendPhoneState("FAILED");
			}
		}, 50);
	} catch (error) {
		console.log(`Phone alert failed: ${JSON.stringify(error)}`);
		stopPhoneAlert();
		sendPhoneState("FAILED");
	}
}

Pebble.addEventListener("ready", () => {
	console.log("Marco Pebble phone locator ready");
});

Pebble.addEventListener("appmessage", (event) => {
	const message = event.payload as PhoneMessage | undefined;
	const command = message?.RING_PHONE;

	if (command === "START") {
		sendPhoneState("REQUEST_RECEIVED");
		startPhoneAlert();
	} else if (command === "STOP") {
		stopPhoneAlert();
		sendPhoneState("STOPPED");
	}
});
