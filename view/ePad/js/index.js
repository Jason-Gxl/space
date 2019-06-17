var number = 0,
	fileListWrap = document.getElementsByClassName("file-list-wrap")[0],
	fileWrapItem = fileListWrap.getElementsByClassName("file-item-wrap")[0],
	tabNameInputWrap = document.getElementsByClassName("tab-name-wrap")[0];

document.getElementById("add_btn").addEventListener("click", function() {
	number++;
	var _fileWrapItem = fileWrapItem.cloneNode(1);
	_fileWrapItem.getElementsByTagName("input")[0].name = "file"+number;
	fileListWrap.appendChild(_fileWrapItem);
});

document.getElementById("show_btn").addEventListener("click", function() {
	var files = [],
		fileInputs = [].slice.call(fileListWrap.getElementsByTagName("input"), 0),
		tabNameInput = tabNameInputWrap.getElementsByTagName("input")[0];

	fileInputs.forEach(function(fileItem) {
		files.push(fileItem.value);
	});

	var data = {
		files: files,
		newTab: true,
		isShow: true,
		tabName: tabNameInput.value || ""
		//tabId: Date.now()
	};

	pad1.showFiles(data);
});

var pad1 = wPad.init({
	id: 1,
	// size: "16:9",
	layout: "leftTop",
	super: true,
	noToolbar: false,
	// data: data,
	noTab: false,
	vertical: false,
	splitpageLayout: "center",
	wrap: document.getElementById("pad1"),
	background: "#fff",
	autoSaveTime: 5,
	// disable: true,
	noCache: false,
	fontSize: 30,
	// toolbars: ["pen", "line", "text", "image", "export", "clear"],
	onRender: function(data) {
		// pad2.render(data);
		console.log("pad1 onRender");
	},
	onShowFiles: function(data) {
		// pad2.showFiles(data);
		console.log("pad1 onShowFiles");
	},
	onMousemove: function(data) {
		// pad2.mouseCtrl(data);
		console.log("pad1 onMousemove");
	},
	onClear: function(data) {
		// pad2.clear(data);
		console.log("pad1 onClear");
	},
	onTabChange: function(id) {
		// pad2.changeTab(id);
		console.log("pad1 onTabChange");
	},
	onTabRemove: function(id) {
		// pad2.removeTab(id);
		console.log("pad1 onTabRemove");
	},
	onPageTurn: function(id, pageNumber, data) {
		// pad2.turnPage(id, pageNumber);
		console.log("pad1 onPageTurn");
	},
	onScroll: function(data) {
		// pad2.scroll(data);
		console.log(data);
	}
});

/*var pad2 = wPad.init({
	id: 2,
	size: "16:9",
	noToolbar: true,
	// data: data,
	wrap: document.getElementById("pad2"),
	background: "#fff",
	autoSaveTime: 5,
	disable: false,
	noCache: false,
	onRender: function(data) {
		pad1.render(data);
		console.log("pad2 onRender");
	},
	onShowFiles: function(data) {
		pad1.showFiles(data);
		console.log("pad2 onShowFiles");
	},
	onMousemove: function(data) {
		pad1.mouseCtrl(data);
		console.log("pad2 onMousemove");
	},
	onClear: function(data) {
		pad1.clear(data);
		console.log("pad2 onClear");
	},
	onTabChange: function(id) {
		//pad1.changeTab(id);
		console.log("pad2 onTabChange");
	},
	onTabRemove: function(id) {
		pad1.removeTab(id);
		console.log("pad2 onTabRemove");
	},
	onPageTurn: function(id, pageNumber) {
		pad1.turnPage(id, pageNumber);
		console.log("pad2 onPageTurn");
	},
	onScroll: function(data) {
		// pad1.scroll(data);
		console.log(data);
	}
});*/