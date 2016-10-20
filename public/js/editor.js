var quill = new Quill('#editor-container', {
  modules: {
    toolbar: [
      ['bold', 'italic'],
      ['link', 'blockquote', 'code-block', 'image'],
      [{ list: 'ordered' }, { list: 'bullet' }]
    ]
  },
  placeholder: 'Compose an epic...',
  theme: 'snow'
});

window.addEventListener("beforeunload", function (e) {
  if (window.unsavedChanges) {
    e.returnValue = 'Unsaved Changes!';
    return 'Unsaved Changes!';
  };
  return;
});

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};


var syncHtml = debounce(function() {
  var contents = document.querySelector('#editor-container').children[0].innerHTML;
  document.querySelector('input[name=text]').value = contents;
  console.log(contents)
  window.unsavedChanges = false;
}, 500);

quill.on('text-change', function() {
  window.unsavedChanges = true;
  syncHtml();
});
