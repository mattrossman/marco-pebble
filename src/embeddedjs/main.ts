import Button from "pebble/button";

let playing = false;
let restartTimer: any;

declare const Natives: {
	marco_speaker_play(): number;
	marco_speaker_stop(): void;
};

function startTone() {
	if (playing)
		return;

	playing = Natives.marco_speaker_play() !== 0;
	console.log(playing ? "Speaker tone on" : "Speaker tone failed to start");

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
