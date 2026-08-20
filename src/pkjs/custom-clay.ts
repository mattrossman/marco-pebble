import type Clay from "@rebble/clay"

type ClayConfig = Clay.ClayConfig

const customClay = function (this: ClayConfig): void {
	function sendCommand(command: "START" | "STOP"): void {
		const response = encodeURIComponent(JSON.stringify({ RING_WATCH: command }))
		const returnTo =
			(window as Window & { returnTo?: string }).returnTo || "pebblejs://close#"

		location.href = returnTo + response
	}

	this.on(this.EVENTS.AFTER_BUILD, () => {
		this.getItemById("ring-watch").on("click", () => {
			sendCommand("START")
		})

		this.getItemById("stop-watch").on("click", () => {
			sendCommand("STOP")
		})
	})
}

export default customClay
