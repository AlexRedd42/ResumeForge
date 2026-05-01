let arrJobs = [];
let strSelectedJobID = '';

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

        const elDescription = document.createElement('span');
        elDescription.textContent = objJobDetail.description;

        const elDeleteButton = document.createElement('button');
        elDeleteButton.type = 'button';
        elDeleteButton.className = 'btn btn-outline-danger btn-sm';
        elDeleteButton.textContent = 'Delete';
        elDeleteButton.setAttribute('aria-label', `Delete responsibility ${objJobDetail.description}`);
        elDeleteButton.addEventListener('click', async () => {
            await deleteJobDetailAsync(objJobDetail.detailId);
        });

        elJobDetailItem.appendChild(elDescription);
        elJobDetailItem.appendChild(elDeleteButton);
        elJobDetailsList.appendChild(elJobDetailItem);
    });
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
    const objFormData = new FormData(elForm);
    const objJobDetail = {
        jobId: strSelectedJobID,
        description: objFormData.get('description').trim()
    };

    if (!objJobDetail.description) {
        showJobsMessage('Responsibility description is required.', 'danger');
        return;
    }

    const objResponse = await fetch('/api/job-details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objJobDetail)
    });

    await parseJsonResponseAsync(objResponse);

    elForm.reset();
    showJobsMessage('Responsibility saved successfully.', 'success');
    await loadJobDetailsAsync();
}

async function deleteJobDetailAsync(strDetailID) {
    clearJobsMessage();

    const objResponse = await fetch(`/api/job-details/${encodeURIComponent(strDetailID)}`, {
        method: 'DELETE'
    });

    await parseJsonResponseAsync(objResponse);
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
}

window.loadJobsViewAsync = loadJobsViewAsync;
document.addEventListener('DOMContentLoaded', initializeJobs);
