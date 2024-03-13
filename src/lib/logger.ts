export class Logger {
	silent: boolean;
	constructor(silent = false) {
		this.silent = silent;
	}

	info(...messages: string[]) {
		if (this.silent) {
			return;
		}
		console.info(...messages);
	}

	warn(...messages: string[]) {
		if (this.silent) {
			return;
		}
		console.warn(...messages);
	}

	error(...messages: string[]) {
		if (this.silent) {
			return;
		}
		console.error(...messages);
	}
}

export const logger = new Logger();