let objJobDetailQuill = null;

function initializeJobDetailQuill() {
    const elEditor = document.getElementById('divJobDetailEditor');

    if (!elEditor || objJobDetailQuill || !window.Quill) {
        return;
    }

    // Quill is used only for resume bullet content. Layout, navigation, and preview rendering stay outside this editor.
    objJobDetailQuill = new Quill('#divJobDetailEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ list: 'bullet' }, { list: 'ordered' }]
            ]
        }
    });
}

function getJobDetailQuillContent() {
    if (!objJobDetailQuill) {
        return '';
    }

    return objJobDetailQuill.root.innerHTML;
}

function setJobDetailQuillContent(strContent) {
    if (!objJobDetailQuill) {
        return;
    }

    objJobDetailQuill.root.innerHTML = strContent;
}

function clearJobDetailQuillContent() {
    setJobDetailQuillContent('');
}

function isJobDetailQuillContentEmpty() {
    if (!objJobDetailQuill) {
        return true;
    }

    return !objJobDetailQuill.getText().trim();
}

window.initializeJobDetailQuill = initializeJobDetailQuill;
window.getJobDetailQuillContent = getJobDetailQuillContent;
window.setJobDetailQuillContent = setJobDetailQuillContent;
window.clearJobDetailQuillContent = clearJobDetailQuillContent;
window.isJobDetailQuillContentEmpty = isJobDetailQuillContentEmpty;
