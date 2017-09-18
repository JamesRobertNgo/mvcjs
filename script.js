const EventfulObject = class extends Eventful {
	constructor(obj) {
		super();
	}

	setProp(prop, value) {
		let value = null;
		this.defineProperties(this, prop, {
			get: function() {
				this.trigger(`get:${prop}`, value);
				return value;
			},
			set: function(newValue) {
				const oldValue = value;
				value = newValue;
				this.trigger(`set:${prop}`, oldValue, value);
			}
		});
		this[prop] = value;
	}

	unsetProp(prop) {
		delete this[prop];
	}
}

// --------------------------------------------------

const mvcjs = {};

mvcjs.model = ['load test', 'another load test'];

mvcjs.View = class extends jhn.Eventful {
	render(wrapper) {
		const $el = this.$el = $('<div></div>');

		const $list = this.$list = $('<ol></ol>');
		$el.append($list);

		const $entry = $('<p><input type="text"> <button type="button">Add</button></p>');
		const $entryInput = $entry.find('input');
		$entry.find('button').on('click', (e) => {
			e.preventDefault();
			this.insert($entryInput.val() || undefined);
			$entryInput.val('');
		});
		$el.append($entry);

		if (wrapper) {
			$(wrapper).append($el);
		}
		this.trigger('render', $el);
		return $el;
	}

	insert(label = 'Untitled') {
		const $listItem = $(`<li>${label} <button type="button">Remove</button></li>`);
		$listItem.find('button').on('click', (e) => {
			const idx = this.$list.children('li').index($listItem);
			this.remove(idx);
		})
		this.$list.append($listItem);
		this.trigger('insert', label);
	}

	remove(idx) {
		const $listItem = this.$list.children(`li:nth-child(${idx + 1})`);
		$listItem.detach();
		this.trigger('remove', idx);
	}
};

mvcjs.controller = {
	init: function(model, view) {
		view.on('render', ($el) => {
			for (const label of model) {
				view.insert(label);
			}
			view.on('insert', (label) => model.push(label));
			view.on('remove', (idx) => model.splice(idx, 1));
		});
	}
};

$(function() {
	const view = new mvcjs.View();
	mvcjs.controller.init(mvcjs.model, view);
	view.render(document.body);
});
