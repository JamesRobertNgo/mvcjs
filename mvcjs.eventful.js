/** ====================================================================================================
MVCJS framework namespace.
*/
window.mvcjs = window.mvcjs || {};

/** ====================================================================================================
Class to add event management to an object.
*/
mvcjs.Eventful = (() => {
	return class {

		/** Add a property to hold event handlers. */
		constructor() {
			this._events = {};
		}

		/**
		Adds an event handler to one or more event names.
		| Arguments    | Type     | Description
		| ---          | ---      | ---
		| eventNames   | String   | A comma separated list of event names. Event modifier is added with a colon.
		| eventHandler | Function | Event handler.
		*/
		on(eventNames, eventHandler) {
			for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
				if (!this._events[eventName]) {
					this._events[eventName] = [];
				}
				this._events[eventName].push(eventHandler);
			}
		}

		/**
		Removes one, or all, event handlers assigned to one or more event names.
		| Arguments    | Type     | Description
		| ---          | ---      | ---
		| eventNames   | String   | A comma separated list of event names. Event modifier is added with a colon.
		| eventHandler | Function | Optional. Event handler. If omitted, all event handlers associated to the one or more event names will be removed.
		*/
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

		/**
		Run one or more event handlers associated to the event name / names.
		| Arguments  | Type   | Description
		| ---        | ---    | ---
		| eventNames | String | A comma separated list of event names. Event modifier is added with a colon.
		| ...args    | Any    | Optional. Arguments to be passed to the event handlers.
		*/
		trigger(eventNames, ...args) {
			console.log('trigger', eventNames, args);
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
			})();
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
})();

/** ====================================================================================================
Class to add 'get', 'set' and 'change' events to an object.
*/
mvcjs.EventfulObjectLike = (() => {
	return class extends mvcjs.Eventful {

		/**
		Takes a plain old JavaScript object and make properties with 'get', 'set' and 'change' events.
		| Arguments | Type   | Description
		| ---       | ---    | ---
		| obj       | Object | Base object to recreate. When omitted an empty object is used instead.
		*/
		constructor(obj = {}) {
			super();
			for (let k in obj) {
				this.setProp(k, obj[k]);
			}
		}

		/**
		Creates a new property that contains 'get', 'set' and 'change' events triggers.
		| Arguments | Type   | Description
		| ---       | ---    | ---
		| prop      | String | Property to be added to the object.
		| value     | Any    | Optional. Initial value for the new property.
		*/
		setProp(prop, value) {
			if (!this[prop]) {
				let _value = null;
				Object.defineProperty(this, prop, {
					configurable: true,
					enumerable: true,
					get: () => {
						this.trigger(`get:${prop}`, _value);
						return _value;
					},
					set: (newValue) => {
						const oldValue = _value;
						if (oldValue != newValue) {
							_value = mvcjs.finalizeValue(newValue);
							this.trigger(`change:${prop}`, newValue, oldValue);
						}
						this.trigger(`set:${prop}`, newValue, oldValue);
					}
				});
			}
			if (value) {
				this[prop] = value;
			}
		}

		/**
		Returns  a plain old JavaScript object from this 'Object Like' object.
		The event variable is excluded.
		*/
		toObject() {
			const retVal = {};
			for (const key in this) {
				if (this.hasOwnProperty(key) && key != '_events') {
					retVal[key] = this[key];
				}
			}
			return retVal;
		}

		/** Removes a property from the object */
		unsetProp(prop) {
			delete this[prop];
		}
	}
})();

mvcjs.EventfulArrayLike = (() => {
	function defineProperty(idx) {
		Object.defineProperty(this, idx, {
			configurable: true,
			enumerable: true,
			get: () => {
				const retVal = this._arr[idx];
				this.trigger(`get:${idx}`, retVal);
				return retVal;
			},
			set: (newValue) => {
				const oldValue = this._arr[idx];
				newValue = mvcjs.finalizeValue(newValue);
				if (oldValue != newValue) {
					this._arr[idx] = newValue;
					this.trigger(`change:${idx}`, oldValue, newValue);
				}
				this.trigger(`set:${idx}`, oldValue, newValue);
			}
		});
	}

	return class extends mvcjs.Eventful {
		constructor(arr = []) {
			super();

			// Private property.
			const _arr = this._arr = [];

			// Length property.
			Object.defineProperty(this, 'length', {
				get: () => {
					return _arr.length;
				}
			});

			// Add array methods to be array-like.
			const arryMethods = Object.getOwnPropertyNames(Array.prototype);
			for (const key of arryMethods) {
				if (!this.hasOwnProperty(key) && this[key] === undefined && typeof Array.prototype[key] === 'function') {
					this[key] = (...args) => {
						const retVal = Array.prototype[key].apply(_arr, args);
						if (Array.isArray(retVal)) {
							retVal = new EventfulArray(retVal);
						}
						this.trigger(key, args);
						return retVal;
					};
				}
			}

			// Push elements to array-like.
			this.push(...arr);
		}

		pop() {
			if (this._arr.length > 0) {
				delete this[this._arr.length - 1];
			}
			this.trigger('pop');
			return this._arr.pop();
		}

		push(...args) {
			const len = args.length;
			for (let idx = 0; idx < len; idx++) {
				defineProperty.call(this, this._arr.length + idx);
				args[idx] = mvcjs.finalizeValue(args[idx]);
			}
			this.trigger('push', ...args);
			return Array.prototype.push.apply(this._arr, args);
		}

		shift() {
			if (this._arr.length > 0) {
				delete this[this._arr.length - 1];
			}
			this.trigger('shift');
			return this._arr.shift();
		}

		splice(start = 0, deleteCount = 0, ...items) {
			const len = items.length;
			const delta = len - deleteCount;
			if (delta > 0) {
				for (let idx = 0; idx < delta; idx++) {
					defineProperty.call(this, this._arr.length + idx);
				}
			} else if (delta < 0) {
				for (let idx = 0; idx > delta; idx--) {
					delete this._arr[this._arr.length - 1 + idx];
				}
			}
			for (let idx = 0; idx < len; idx++) {
				items[idx] = mvcjs.finalizeValue(items[idx]);
			}
			this.trigger('splice', start, deleteCount, ...items);
			return this._arr.splice(start, deleteCount, ...items);
		}

		toArray() {
			return this._arr.slice();
		}

		toLocaleString(...args) {
			const retVal = Array.prototype.toLocaleString.apply(this._arr, args);
			return retVal;
		}

		toString() {
			const retVal = this._arr.toString();
			return retVal;
		}

		unshift(...args) {
			const len = args.length;
			for (let idx = 0; idx < len; idx++) {
				defineProperty.call(this, this._arr.length + idx);
				args[idx] = mvcjs.finalizeValue(args[idx]);
			}
			this.trigger('unshift', ...args);
			return Array.prototype.unshift.apply(this._arr, args);
		}
	}
})();

mvcjs.finalizeValue = function(value) {
	if (typeof value === 'object') {
		value = new mvcjs.EventfulObjectLike(value);
	} else if (Array.isArray(value)) {
		value = new mvcjs.EventfulArrayLike(value);
	}
	return value;
}

class Eventful {
	constructor() {
		Eventful.factory(this);
	}
}

Eventful.factory = function(obj) {
	const events = {};
	Object.defineProperties(obj, {
		'off': {
			configurable: false,
			enumerable: false,
			value: (eventNames, eventHandler) => {
				for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
					if (events[eventName]) {
						if (eventHandler) {
							let idx;
							while ((() => idx = events[eventName].indexOf(eventHandler))() != -1) {
								if (events[eventName].length == 1) {
									delete events[eventName];
									break;
								}
								events[eventName].splice(idx, 1);
							}
						} else {
							delete events[eventName];
						}
					}
				}
			},
			writable: false
		},
		'on': {
			configurable: false,
			enumerable: false,
			value: (eventNames, eventHandler) => {
				for (const eventName of eventNames.replace(/\s/g, '').split(',')) {
					if (!events[eventName]) {
						events[eventName] = [];
					}
					events[eventName].push(eventHandler);
				}
			},
			writable: false
		},
		'trigger': {
			configurable: false,
			enumerable: false,
			value: (eventNames, ...args) => {
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
				})();
				const done = [];
				for (const eventName of finalEventNames) {
					if (events[eventName]) {
						for (const eventHandler of events[eventName]) {
							if (done.indexOf(eventHandler) == -1) {
								eventHandler.apply(this, args);
								done.push(eventHandler);
							}
						}
					}
				}
			},
			writable: false
		}
	});
}

