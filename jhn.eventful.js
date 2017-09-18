window.jhn = window.jhn || {};

jhn.Eventful = class {
	constructor() {
		this._events = {};
	}

	on(eventNames, eventHandler) {
		for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
			if (!this._events[eventName]) {
				this._events[eventName] = [];
			}
			this._events[eventName].push(eventHandler);
		}
	}

	off(eventNames, eventHandler) {
		for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
			if (this._events[eventName]) {
				if (eventHandler) {
					let idx = this._events[eventName].indexOf(eventHandler);
					while (idx != -1) {
						if (this._events[eventName].length == 1) {
							delete this._events[eventName];
							break;
						}
						this._events[eventName].splice(idx, 1);
						idx = this._events[eventName].indexOf(eventHandler);
					}
				} else {
					delete this._events[eventName];
				}
			}
		}
	}

	trigger(eventNames, ...args) {
		const finalEventNames = (() => {
			let finalEventNames = [];
			for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
				let finalEventName = '';
				const tempFinalEventNames = [];
				for (const eventNamePart of eventName.split(':')) {
					finalEventName = (finalEventName ? finalEventName + ':' : '') + eventNamePart;
					tempFinalEventNames.push(finalEventName);
				}
				finalEventNames = finalEventNames.concat(tempFinalEventNames.reverse());
			}
			return finalEventNames;
		})()
		const done = [];
		for (const eventName of finalEventNames) {
			if (this._events[eventName]) {
				for (const eventHandler of this._events[eventName]) {
					if (done.indexOf(eventHandler) == -1) {
						eventHandler.apply(this, args);
						done.push(eventHandler);
					}
				}
			}
		}
	}
}
