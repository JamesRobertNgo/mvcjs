


const app = {};

app.model = ['load test', 'another load test'];

app.View = class extends mvcjs.Eventful {
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

app.controller = {
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
	let arrLike = new mvcjs.EventfulArray([1, 2, 3, 4]);
	console.log('arr', arrLike._arr.toString());
	arrLike[3] = { value: 123 };
	arrLike[3].value = 456;
	console.log('arr', arrLike._arr.toString());
	arrLike.push('abc', 'def');
	console.log('arr', arrLike._arr.toString());
	arrLike.pop();
	console.log('arr', arrLike._arr.toString());
	arrLike.shift();
	console.log('arr', arrLike._arr.toString());
	arrLike.unshift('A', 'B', 'C');
	console.log('arr', arrLike._arr.toString());
	arrLike.splice(1, 2, 'D', 'E');
	console.log('arr', arrLike._arr.toString());

	console.log('arrLike', arrLike, arrLike.length);
	console.log('arr', arrLike._arr);
	console.log('toObject', arrLike[5].toObject());
});
