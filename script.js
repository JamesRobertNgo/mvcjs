class Navi {
	constructor(viewDefs, defViewCfg) {
		this.views = {};
		this.nextView = null;
	}

	closeView(view) {
		const viewIdx = this.views.indexOf(view);
		if (viewIdx != -1) {
			if (this.views[this.views.length - 1] == view) {
				view.hide();
				if (this.views.length > 0) {
					this.openView(this.views[this.views.length - 1]);
				} else {
					this.openView();
				}
			}
			this.views.splice(viewIdx, 1);
			view.destroy();
		}
	}

	// (view, showOpts)
	// (defKey, instKey, showOpts)
	openView(...args) {
		if (args[0] instanceof NaviView) {
			const view = args[0];
			const showOpts = args[1];
			const cbk = args[2];

		} else if (typeof args[0] === 'string') {
			const defKey = args[0];
			const instKey = args[1];
			const showOpts = args[2];
			const cbk = args[3];
			// TODO -
		} else {
			const cbk = args[0];

			if (this.nextView) {

			} else {

			}
		}
	}
}

class NaviView {
	constructor() {}
}


$(function() {
	const obj = {
		test: 1
	};
	const arr = [obj, 2, 3];
	const val = arr[0];
	arr.splice(0, 1);
	arr.push(val);
	console.log(arr);
});
