let arrJobs = [];
let strSelectedJobID = '';
let strEditingDetailID = '';

function showJobsMessage(strMessage, strType) {
    const elMessage = document.getElementById('divJobsMessage');

    elMessage.textContent = strMessage;
    elMessage.className = `alert alert-${strType}`;
}

function clearJobsMessage() {
    const elMessage = document.getElementById('divJobsMessage');

    elMessage.textContent = '';
    elMessage.className = 'alert d-none';
}

async function parseJsonResponseAsync(objResponse) {
    const objData = await objResponse.json();

    if (!objResponse.ok) {
        throw new Error(objData.message || 'Request failed');
    }

    return objData;
}

function getSelectedJob() {
    return arrJobs.find((objJob) => objJob.jobId === strSelectedJobID);
}

function renderJobsList() {
    const elJobsList = document.getElementById('divJobsList');

    elJobsList.innerHTML = '';

    if (arrJobs.length === 0) {
        const elEmptyMessage = document.createElement('p');
        elEmptyMessage.className = 'mb-0';
        elEmptyMessage.textContent = 'No jobs have been added yet.';
        elJobsList.appendChild(elEmptyMessage);
        return;
    }

    arrJobs.forEach((objJob) => {
        const elJobRow = document.createElement('div');
        elJobRow.className = 'list-group-item';

        const elContentWrapper = document.createElement('div');
        elContentWrapper.className = 'd-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2';

        const elJobButton = document.createElement('button');
        elJobButton.type = 'button';
        elJobButton.className = 'btn btn-link text-start p-0';
        elJobButton.textContent = `${objJob.jobTitle} at ${objJob.companyName}`;
        elJobButton.setAttribute('aria-label', `Select ${objJob.jobTitle} at ${objJob.companyName}`);
        elJobButton.addEventListener('click', async () => {
            strSelectedJobID = objJob.jobId;
            await loadJobDetailsAsync();
            renderJobsList();
        });

        const elJobDates = document.createElement('small');
        elJobDates.className = 'text-body-secondary';
        elJobDates.textContent = `${objJob.startDate} to ${objJob.endDate || 'Present'}`;

        const elTextWrapper = document.createElement('div');
        elTextWrapper.appendChild(elJobButton);
        elTextWrapper.appendChild(elJobDates);

        const elDeleteButton = document.createElement('button');
        elDeleteButton.type = 'button';
        elDeleteButton.className = 'btn btn-outline-danger btn-sm';
        elDeleteButton.textContent = 'Delete';
        elDeleteButton.setAttribute('aria-label', `Delete ${objJob.jobTitle} at ${objJob.companyName}`);
        elDeleteButton.addEventListener('click', async () => {
            await deleteJobAsync(objJob.jobId);
        });

        if (objJob.jobId === strSelectedJobID) {
            elJobRow.classList.add('active');
            elJobRow.setAttribute('aria-current', 'true');
        }

        elContentWrapper.appendChild(elTextWrapper);
        elContentWrapper.appendChild(elDeleteButton);
        elJobRow.appendChild(elContentWrapper);
        elJobsList.appendChild(elJobRow);
    });
}

function renderSelectedJobLabel() {
    const elSelectedJobName = document.getElementById('pSelectedJobName');
    const objSelectedJob = getSelectedJob();

    if (!objSelectedJob) {
        elSelectedJobName.textContent = 'Select a job to manage its responsibilities.';
        return;
    }

    elSelectedJobName.textContent = `Selected: ${objSelectedJob.jobTitle} at ${objSelectedJob.companyName}`;
}

async function loadJobsAsync() {
    const objResponse = await fetch('/api/jobs');
    arrJobs = await parseJsonResponseAsync(objResponse);

    if (arrJobs.length > 0 && !arrJobs.some((objJob) => objJob.jobId === strSelectedJobID)) {
        strSelectedJobID = arrJobs[0].jobId;
    }

    if (arrJobs.length === 0) {
        strSelectedJobID = '';
    }

    renderJobsList();
    renderSelectedJobLabel();
}

async function saveJobAsync(objEvent) {
    objEvent.preventDefault();
    clearJobsMessage();

    const elForm = document.getElementById('formJob');
    const objFormData = new FormData(elForm);
    const objJob = {
        companyName: objFormData.get('companyName').trim(),
        jobTitle: objFormData.get('jobTitle').trim(),
        startDate: objFormData.get('startDate').trim(),
        endDate: objFormData.get('endDate').trim()
    };

    if (!objJob.companyName || !objJob.jobTitle || !objJob.startDate) {
        showJobsMessage('Company name, job title, and start date are required.', 'danger');
        return;
    }

    const objResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objJob)
    });

    const objResult = await parseJsonResponseAsync(objResponse);

    strSelectedJobID = objResult.jobId;
    elForm.reset();
    showJobsMessage('Job saved successfully.', 'success');
    await loadJobsAsync();
    await loadJobDetailsAsync();
}

async function deleteJobAsync(strJobID) {
    clearJobsMessage();

    const objResponse = await fetch(`/api/jobs/${encodeURIComponent(strJobID)}`, {
        method: 'DELETE'
    });

    await parseJsonResponseAsync(objResponse);

    if (strSelectedJobID === strJobID) {
        strSelectedJobID = '';
    }

    showJobsMessage('Job deleted successfully.', 'success');
    await loadJobsAsync();
    await loadJobDetailsAsync();
}

function renderJobDetailsList(arrJobDetails) {
    const elJobDetailsList = document.getElementById('ulJobDetailsList');

    elJobDetailsList.innerHTML = '';

    if (!strSelectedJobID) {
        const elEmptyItem = document.createElement('li');
        elEmptyItem.className = 'list-group-item';
        elEmptyItem.textContent = 'Select a job before adding responsibilities.';
        elJobDetailsList.appendChild(elEmptyItem);
        return;
    }

    if (arrJobDetails.length === 0) {
        const elEmptyItem = document.createElement('li');
        elEmptyItem.className = 'list-group-item';
        elEmptyItem.textContent = 'No responsibilities have been added for this job.';
        elJobDetailsList.appendChild(elEmptyItem);
        return;
    }

    arrJobDetails.forEach((objJobDetail) => {
        const elJobDetailItem = document.createElement('li');
        elJobDetailItem.className = 'list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2';

        const elContent = document.createElement('div');
        elContent.innerHTML = objJobDetail.content;

        const elButtonWrapper = document.createElement('div');
        elButtonWrapper.className = 'd-flex gap-2';

        const elEditButton = document.createElement('button');
        elEditButton.type = 'button';
        elEditButton.className = 'btn btn-outline-primary btn-sm';
        elEditButton.textContent = 'Edit';
        elEditButton.setAttribute('aria-label', 'Edit responsibility');
        elEditButton.addEventListener('click', () => {
            beginEditJobDetail(objJobDetail);
        });

        const elDeleteButton = document.createElement('button');
        elDeleteButton.type = 'button';
        elDeleteButton.className = 'btn btn-outline-danger btn-sm';
        elDeleteButton.textContent = 'Delete';
        elDeleteButton.setAttribute('aria-label', 'Delete responsibility');
        elDeleteButton.addEventListener('click', async () => {
            await deleteJobDetailAsync(objJobDetail.detailId);
        });

        elButtonWrapper.appendChild(elEditButton);
        elButtonWrapper.appendChild(elDeleteButton);
        elJobDetailItem.appendChild(elContent);
        elJobDetailItem.appendChild(elButtonWrapper);
        elJobDetailsList.appendChild(elJobDetailItem);
    });
}

function resetJobDetailForm() {
    strEditingDetailID = '';
    window.clearJobDetailQuillContent();

    document.getElementById('btnSaveJobDetail').textContent = 'Add Responsibility';
    document.getElementById('btnCancelJobDetailEdit').classList.add('d-none');
}

function beginEditJobDetail(objJobDetail) {
    strEditingDetailID = objJobDetail.detailId;
    window.setJobDetailQuillContent(objJobDetail.content);

    document.getElementById('btnSaveJobDetail').textContent = 'Update Responsibility';
    document.getElementById('btnCancelJobDetailEdit').classList.remove('d-none');
}

async function loadJobDetailsAsync() {
    renderSelectedJobLabel();

    if (!strSelectedJobID) {
        renderJobDetailsList([]);
        return;
    }

    const objResponse = await fetch(`/api/job-details?jobId=${encodeURIComponent(strSelectedJobID)}`);
    const arrJobDetails = await parseJsonResponseAsync(objResponse);
    renderJobDetailsList(arrJobDetails);
}

async function saveJobDetailAsync(objEvent) {
    objEvent.preventDefault();
    clearJobsMessage();

    if (!strSelectedJobID) {
        showJobsMessage('Select a job before adding a responsibility.', 'danger');
        return;
    }

    const elForm = document.getElementById('formJobDetail');
    const objJobDetail = {
        jobId: strSelectedJobID,
        content: window.getJobDetailQuillContent()
    };

    if (window.isJobDetailQuillContentEmpty()) {
        showJobsMessage('Responsibility content is required.', 'danger');
        return;
    }

    const objRequestBody = strEditingDetailID
        ? { detailId: strEditingDetailID, jobId: objJobDetail.jobId, content: objJobDetail.content }
        : objJobDetail;

    const objResponse = await fetch('/api/job-details', {
        method: strEditingDetailID ? 'PUT' : 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objRequestBody)
    });

    await parseJsonResponseAsync(objResponse);

    elForm.reset();
    resetJobDetailForm();
    showJobsMessage('Responsibility saved successfully.', 'success');
    await loadJobDetailsAsync();
}

async function deleteJobDetailAsync(strDetailID) {
    clearJobsMessage();

    const objResponse = await fetch(`/api/job-details/${encodeURIComponent(strDetailID)}`, {
        method: 'DELETE'
    });

    await parseJsonResponseAsync(objResponse);
    resetJobDetailForm();
    showJobsMessage('Responsibility deleted successfully.', 'success');
    await loadJobDetailsAsync();
}

async function loadJobsViewAsync() {
    try {
        await loadJobsAsync();
        await loadJobDetailsAsync();
    } catch (error) {
        showJobsMessage(error.message, 'danger');
    }
}

function initializeJobs() {
    const elJobForm = document.getElementById('formJob');
    const elJobDetailForm = document.getElementById('formJobDetail');
    const elCancelJobDetailEditButton = document.getElementById('btnCancelJobDetailEdit');

    window.initializeJobDetailQuill();

    // Each form owns one submit handler so the SPA can save data without a page refresh.
    elJobForm.addEventListener('submit', async (objEvent) => {
        try {
            await saveJobAsync(objEvent);
        } catch (error) {
            showJobsMessage(error.message, 'danger');
        }
    });

    elJobDetailForm.addEventListener('submit', async (objEvent) => {
        try {
            await saveJobDetailAsync(objEvent);
        } catch (error) {
            showJobsMessage(error.message, 'danger');
        }
    });

    elCancelJobDetailEditButton.addEventListener('click', () => {
        resetJobDetailForm();
    });
}

window.loadJobsViewAsync = loadJobsViewAsync;
document.addEventListener('DOMContentLoaded', initializeJobs);
