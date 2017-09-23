(function () {

	var preamble = "<div class='slide'>";
	var end = "</div>";
	var empty = preamble + end;
	var footerHt = "30px";
	var root;
	var editView;
	var editor;
	var footerView;
	var mainView;
	var slideView;
	var slideList;
	var forward = [ 39, 13, 32, 76, 74, 40, 78 ];
	var backward = [ 37, 8, 72, 75, 38, 80 ];
	var curSlideIdx = 0;
	var slides = [];
	var slideLines = [];
  var filename = "presentation.html";
	var editorVisible = false;
	var fileBtn;
	var inputDelay = 300;
	var maxFontVw = 20.0;
	var minFontVw = 0.5;
	var fontDecreaseStep = 0.25;
	var createElement = function (t) { return document.createElement(t); };

	window.requestAnimationFrame(setup);

	function setup(t) {
		if (document.body == null) {
			window.requestAnimationFrame(setup);
			return;
		}

		css();
		createElements();
		configureEditor();
		configureSlides();
		configureEvents();
	};

	function css() {

		var style = createElement("style");
		document.head.appendChild(style);

		[
			"html{box-sizing:content-box;}",
	
			"*,*:before,*:after{box-sizing:inherit;}",

			"html,body{height:100%;width:100%;margin:0;}",

			"#root{height:100%;display:flex;flex-direction:column;}",

			"#main{height:100%;width:100%;display:flex;flex-direction:row;}",

			"#editView{height:100%;display:none;}",

			"#footerView{display:none;flex-direction:row;margin:2px;padding:2px;height:"+footerHt+";}",

			"#slideView{display:flex;align-items:center;justify-content:center;width:100%;}",

			".slide{white-space:pre;padding:1vw;line-height:100%;}",

			".fill{overflow:hidden;background-repeat:no-repeat;background-size:contain;background-position:center;background-origin:content-box;height:100%;width:100%;}",

			".editor{height:calc(100% - 10px);resize:horizontal;font-size:14px;}",

			"#file{display:none}"
		].map(function(e, i) { style.sheet.insertRule(e, i); });
	}

	function createElements() {
		root = createElement('div');
		root.id = 'root';

		editView = createElement('div');
		editView.id = 'editView';

		editor = createElement('textarea');
		editor.className = 'editor';
		editor.cols = 40;
		editView.appendChild(editor);

		footerView = createElement('div');
		footerView.id = 'footerView';

		var saveBtn = createElement('input');
		saveBtn.id = 'save';
		saveBtn.type = 'button';
		saveBtn.value = 'save';
		saveBtn.onclick = save;
		footerView.appendChild(saveBtn);

		var loadBtn = createElement('input');
		loadBtn.id = 'load';
		loadBtn.type = 'button';
		loadBtn.value = 'load';
		loadBtn.onclick = load;
		footerView.appendChild(loadBtn);

		fileBtn = createElement('input');
		fileBtn.id = 'file';
		fileBtn.type = 'file';
		fileBtn.onchange = loadFile;
		footerView.appendChild(fileBtn);

		var newBtn = createElement('input');
		newBtn.id = 'new';
		newBtn.type = 'button';
		newBtn.value = 'new';
		newBtn.onclick = newFile;
		footerView.appendChild(newBtn);
	
		mainView = createElement('div');
		mainView.id = 'main';

		slideView = createElement('div');
		slideView.id = 'slideView';

		mainView.appendChild(editView);
		mainView.appendChild(slideView);
		root.appendChild(mainView);
		root.appendChild(footerView);
		document.body.appendChild(root);
	}

	function configureEditor() {
		var resizingEditor = false;

		editor.onmousedown = function (e) { resizingEditor = true; };

		window.onmousemove = throttle(function (e) {
			if (!resizingEditor) return;
			resize(slideView);
		});

		window.onmouseup = function (e) {
			resizingEditor = false;
			resize(slideView);
		};

		editor.onkeyup = debounce(handleEditorChange, inputDelay, false);
		editor.oninput = debounce(handleEditorChange, inputDelay, false);
		editor.onclick = debounce(handleEditorChange, inputDelay, false);
	}

	function configureSlides() {
		var x = document.querySelectorAll('script'),
			data = x.length == 0 ? "No Data" : x[0].innerText,
			slides = create(data);

		editor.value = data;
		show(slides[curSlideIdx]);
	}

	function configureEvents() {
		document.onkeydown = function (e) {
			if (document.activeElement != document.body) {
				if (e.keyCode == 27) {
					toggleEditor();
				} else {
					window.requestAnimationFrame(function () { resize(slideView); });
				}
				return;
			}

			if (backward.includes(e.keyCode)) {
				curSlideIdx--;
				if (curSlideIdx < 0) curSlideIdx = slides.length - 1;
			} else if (forward.includes(e.keyCode)) {
				curSlideIdx++;
				if (curSlideIdx == slides.length) curSlideIdx = 0;
			} else if (e.keyCode == 36) {
				curSlideIdx = 0;
			} else if (e.keyCode == 35) {
				curSlideIdx = slides.length - 1;
			} else if (e.keyCode == 27) {
				toggleEditor();
			} else {
				return;
			}
			window.requestAnimationFrame(function () { show(slides[curSlideIdx]); });
		};

		window.onresize = throttle(function (e) { show(slides[curSlideIdx]); });
	}

	function create(data, lineNum) {
		slides = [];
		slideLines = [];
		if (!data.endsWith("\n"))
			data += "\n";

		var lines = data.split("\n"), curSlide, hasImage;
		var lastInsertedSlide = -1;

		function reset() { 
			curSlide = preamble; 
			hasImage = false;
			lastInsertedSlide++;
		}

		function fix(d) { return d.replace(/\\(.)/g, "$1"); }

		function checkLineNum(cur) {
			if (lineNum == undefined) return;
			if (cur == lineNum) {
				curSlideIdx = lastInsertedSlide;
			}
		}

		reset();

		var charCount = 0;
		for (var i = 0, len = lines.length; i < len; i++) {
			var line = lines[i];
			if (line.startsWith("#")) {
					checkLineNum(i);
			} else if (line == "\\") {
				if (slides.length > 0 && slides[slides.length - 1] != empty) {
					slides.push(empty);
					slideLines[slides.length - 1] = charCount;
					checkLineNum(i);
					reset();
				}
			} else if (line == "") {
				if (curSlide != preamble) {
					slides.push((curSlide.endsWith("<br>") ? curSlide.slice(0, -4) : curSlide) + end);
					slideLines[slides.length - 1] = charCount;
					checkLineNum(i);
					reset();
				}
			} else {
				if (line.startsWith("@")) {
					curSlide = "<div style='background-image: url(\"" + line.slice(1) + "\");' class='fill'>";
					hasImage = true;
				} else if (!hasImage) {
					curSlide += escape(line.startsWith("\\") ? fix(line.slice(1)) : fix(line)) + "<br>";
				}
				checkLineNum(i);
			}
			charCount += line.length + 1;
		}

		return slides;
	}

	function show(data) {
		if (data === undefined) data = "";
		slideView.innerHTML = data;
		resize(slideView);
	}

	function isOverflown(element) {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
	}

	function resize(el) {
		var cur = maxFontVw;
		el.style.fontSize = cur + "vw";
		var body = document.body;
		while (cur > minFontVw) {
			if (!isOverflown(el) && body.scrollHeight <= body.clientHeight && body.scrollWidth <= body.clientWidth) break;

			cur -= fontDecreaseStep;
			el.style.fontSize = cur + "vw";
		}
	}

	function handleEditorChange() {
		var lineNum = editor.value.substr(0, editor.selectionStart).split("\n").length - 1;
		slides = create(editor.value, lineNum);
		show(slides[curSlideIdx]);
	}

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

	function toggleEditor() {
		if (editorVisible)
			hideEditor();
		else
			showEditor();
	}

	function hideEditor() {
		if (document.activeElement) document.activeElement.blur();
		slideView.focus();
		editView.style.display = 'none';
		footerView.style.display = 'none';
		editorVisible = false;
		resize(slideView);
	}

	function showEditor() {
		editView.style.display = 'block';
		footerView.style.display = 'flex';
		editor.selectionStart = editor.selectionEnd = slideLines[curSlideIdx] - 1;
		editor.focus();
		editorVisible = true;
	}

	function save() {
		if ('Blob' in window) {
			filename = prompt('Please enter file name to save', filename);
			if (filename) {
				var textToWrite = "<meta charset='utf-8'>\r\n<script src='http://unpkg.com/sentjs'>\r\n" + editor.value.replace(/\n/g, '\r\n') + "</script>";
				var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });

				if ('msSaveOrOpenBlob' in navigator) {
					navigator.msSaveOrOpenBlob(textFileAsBlob, filename);
				} else {
					var downloadLink = createElement('a');
					downloadLink.download = filename;
					downloadLink.innerHTML = 'Download File';
					if ('webkitURL' in window) {
						downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
					} else {
						downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
						downloadLink.onclick = destroyClickedElement;
						downloadLink.style.display = 'none';
						document.body.appendChild(downloadLink);
					}

					downloadLink.click();
				}
			}
		} else {
			alert('Your browser does not support the HTML5 Blob.');
		}
	};

	function destroyClickedElement(event) {
		document.body.removeChild(event.target);
	}

	function newFile() {
		hideEditor();
		editor.value = "";
		editor.scrollTop = 0;
		curSlideIdx = 0;
		slides = create(editor.value);
		show(slides[curSlideIdx]);
		showEditor();
		resize(slideView);
	}

	function load() {
		fileBtn.click();
	}

	function loadFile(e) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var data = reader.result;
			var lines = data.split("\n");
			data = '';
			for (var i = 0, len = lines.length; i < len; i++) {
				var line = lines[i];
				var lowercaseLine = line.toLowerCase();
				if (lowercaseLine.startsWith('<meta charset')) {
				} else if (lowercaseLine.startsWith('<script')) {
				} else if (lowercaseLine.startsWith('</script>')) {
				} else {
					data += line + "\n";
				}
			}
			hideEditor();
			editor.value = data;
			editor.scrollTop = 0;
			curSlideIdx = 0;
			slides = create(editor.value);
			show(slides[curSlideIdx]);
		};

		reader.readAsText(e.target.files[0]);
	}

	function throttle(func, wait, options) {
		wait = wait || 250;
		var context, args, result;
		var timeout = null;
		var previous = 0;
		if (!options) options = {};
		var later = function() {
			previous = options.leading === false ? 0 : Date.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};
		return function() {
			var now = Date.now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	};

  function debounce(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };

	function restArgs(func, startIndex) {
		startIndex = startIndex == null ? func.length - 1 : +startIndex;
		return function() {
			var length = Math.max(arguments.length - startIndex, 0),
				rest = Array(length),
				index = 0;
			for (; index < length; index++) {
				rest[index] = arguments[index + startIndex];
			}
			switch (startIndex) {
				case 0: return func.call(this, rest);
				case 1: return func.call(this, arguments[0], rest);
				case 2: return func.call(this, arguments[0], arguments[1], rest);
			}
			var args = Array(startIndex + 1);
			for (index = 0; index < startIndex; index++) {
				args[index] = arguments[index];
			}
			args[startIndex] = rest;
			return func.apply(this, args);
		};
	};

  var delay = restArgs(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });

})();
