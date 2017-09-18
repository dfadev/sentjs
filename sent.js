(function () {
	function escape(unsafe) {
		return unsafe.replace(/[&<"']/g, function(m) {
			switch (m) {
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '"': return '&quot;';
				default : return '&#039;';
			}
		});
	};

	function create(data) {
		var slides = [],
			lines = data.split("\n"),
			curSlide = "<div>",
			hasImage = false;

		function reset() { curSlide = "<div>"; hasImage = false; }
		function fix(d) { return d.replace(/\\(.)/g, "$1"); }

		for (var i = 0, len = lines.length; i < len; i++) {
			var line = lines[i];
			if (line.startsWith("#")) {
			} else if (line == "\\") {
				if (slides.length > 0 && slides[slides.length - 1] != "<div></div>") {
					slides.push("<div></div>");
					reset();
				}
			} else if (line == "") {
				if (curSlide != "<div>") {
					slides.push((curSlide.endsWith("<br>") ? curSlide.slice(0, -4) : curSlide) + "</div>");
					reset();
				}
			} else {
				if (line.startsWith("@")) {
					curSlide = "<div style='height:100%; width:100%; background-image: url(\"" + line.slice(1) + "\");' class='fill'>";
					hasImage = true;
				} else if (!hasImage) {
					curSlide += escape(line.startsWith("\\") ? fix(line.slice(1)) : fix(line)) + "<br>";
				}
			}
		}
		return slides;
	}

	function show(data) {
		var el = document.body;
		el.style.fontSize = "20vw";
		el.innerHTML = data;
		var maxTries = 500;
		while (maxTries > 0) {
			if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) break;

			var curSize = window.getComputedStyle(el).getPropertyValue('font-size'),
				newSize = parseInt(curSize.slice(0, -2)) - 2;
			if (newSize < 9) break;
			el.style.fontSize = newSize + "px";
			maxTries--;
		}
	}

	function throttle(type, name, obj) {
		obj = obj || window;
		var running = false,
			func = function(e) {
			if (running) { return; }
			running = true;
			requestAnimationFrame(function() {
				obj.dispatchEvent(new CustomEvent(name, e));
				running = false;
			});
		};
		obj.addEventListener(type, func, false);
	};

	var style = document.createElement("style");
	document.head.appendChild(style);
	["* { box-sizing: border-box }",
	"html, body { height: 100%; width: 100%; margin: 0; }",
	"body { font-size: 40vw; display: flex; align-items: center; justify-content: center; }",
	"div { white-space: pre; padding: 1vw; }",
	".fill { overflow: hidden; background-repeat: no-repeat; background-size: contain; background-position: center; background-origin: content-box; }"
	].map((e, i) => { style.sheet.insertRule(e, i); });

	window.requestAnimationFrame(setup);
		
	function setup(t) {
		if (document.body == null) {
			window.requestAnimationFrame(setup);
			return;
		}

		var x = document.querySelectorAll('script'),
		//var x = document.querySelectorAll('script[type="presentation"]'),
			data = x.length == 0 ? "No Data" : x[0].innerText,
			slides = create(data);

		var curSlide = 0;
		show(slides[curSlide]);

		var forward = [ 39, 13, 32, 76, 74, 40, 78 ];
		var backward = [ 37, 8, 72, 75, 38, 80 ];

		document.addEventListener("click", function (e) {
			if (e.shiftKey || e.ctrlKey || e.metaKey) {
				curSlide--;
				if (curSlide < 0) curSlide = slides.length - 1;
			} else {
				curSlide++;
				if (curSlide == slides.length) curSlide = 0;
			}
			show(slides[curSlide]);
		});

		document.addEventListener("keydown", function (e) {
			if (backward.includes(e.keyCode)) {
				curSlide--;
				if (curSlide < 0) curSlide = slides.length - 1;
			} else if (forward.includes(e.keyCode)) {
				curSlide++;
				if (curSlide == slides.length) curSlide = 0;
			} else if (e.keyCode == 36) {
				curSlide = 0;
			} else if (e.keyCode == 35) {
				curSlide = slides.length - 1;
			} else {
				console.log(e.keyCode);
				return;
			}
			show(slides[curSlide]);
		}, false);

		throttle("resize", "optResize");
		window.addEventListener("optResize", function (e) { show(slides[curSlide]); }, false);
	};
})();
