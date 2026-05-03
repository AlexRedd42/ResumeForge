let objJobDetailQuill = null;
let strPendingAiImprovement = '';

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

function setImproveButtonLoading(boolIsLoading) {
    const elImproveButton = document.getElementById('btnImproveJobDetail');

    if (!elImproveButton) {
        return;
    }

    elImproveButton.disabled = boolIsLoading;
    elImproveButton.textContent = boolIsLoading ? 'Improving...' : 'Improve with AI';
}

function showAiComparisonModal(strOriginalContent, strImprovedContent) {
    const elOriginalContent = document.getElementById('divAiOriginalContent');
    const elImprovedContent = document.getElementById('divAiImprovedContent');
    const elModal = document.getElementById('modalAiImprovement');
    const objModal = new bootstrap.Modal(elModal);

    strPendingAiImprovement = strImprovedContent;
    elOriginalContent.innerHTML = strOriginalContent;
    elImprovedContent.innerHTML = strImprovedContent;
    objModal.show();
}

async function improveJobDetailWithAiAsync() {
    try {
        const strContent = getJobDetailQuillContent();

        if (isJobDetailQuillContentEmpty()) {
            window.showJobsMessage('Enter responsibility content before using AI improvement.', 'danger');
            return;
        }

        setImproveButtonLoading(true);
        window.clearJobsMessage();

        const objResponse = await fetch('/api/ai/improve-detail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: strContent })
        });
        const objResult = await objResponse.json();

        if (!objResponse.ok) {
            throw new Error(objResult.message || 'Unable to improve content right now');
        }

        showAiComparisonModal(strContent, objResult.improvedContent);
    } catch (error) {
        window.showJobsMessage(error.message, 'danger');
    } finally {
        setImproveButtonLoading(false);
    }
}

function acceptAiImprovement() {
    if (!strPendingAiImprovement) {
        return;
    }

    setJobDetailQuillContent(strPendingAiImprovement);
    strPendingAiImprovement = '';

    const elModal = document.getElementById('modalAiImprovement');
    const objModal = bootstrap.Modal.getInstance(elModal);

    if (objModal) {
        objModal.hide();
    }

    window.showJobsMessage('AI improvement applied. Save the responsibility when ready.', 'success');
}

function initializeAiImprovementControls() {
    const elImproveButton = document.getElementById('btnImproveJobDetail');
    const elAcceptButton = document.getElementById('btnAcceptAiImprovement');

    if (elImproveButton) {
        elImproveButton.addEventListener('click', async () => {
            await improveJobDetailWithAiAsync();
        });
    }

    if (elAcceptButton) {
        elAcceptButton.addEventListener('click', acceptAiImprovement);
    }
}

window.initializeJobDetailQuill = initializeJobDetailQuill;
window.getJobDetailQuillContent = getJobDetailQuillContent;
window.setJobDetailQuillContent = setJobDetailQuillContent;
window.clearJobDetailQuillContent = clearJobDetailQuillContent;
window.isJobDetailQuillContentEmpty = isJobDetailQuillContentEmpty;
document.addEventListener('DOMContentLoaded', initializeAiImprovementControls);
