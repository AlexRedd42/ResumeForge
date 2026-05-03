let strActiveResumeID = '';
let arrResumeAllJobs = [];
let arrResumeAllJobDetails = [];
let arrResumeAllSkills = [];
let objResumeSelectedJobIDs = new Set();
let objResumeSelectedDetailIDs = new Set();
let objResumeSelectedSkillIDs = new Set();

function showResumeMessage(strMessage, strType) {
    const elMessage = document.getElementById('divResumeMessage');

    if (!elMessage) {
        return;
    }

    elMessage.textContent = strMessage;
    elMessage.className = `alert alert-${strType}`;
}

function clearResumeMessage() {
    const elMessage = document.getElementById('divResumeMessage');

    if (!elMessage) {
        return;
    }

    elMessage.textContent = '';
    elMessage.className = 'alert d-none';
}

async function parseResumeJsonResponseAsync(objResponse) {
    const objData = await objResponse.json();

    if (!objResponse.ok) {
        throw new Error(objData.message || 'Request failed');
    }

    return objData;
}

function stripHtml(strContent) {
    const elTemporaryWrapper = document.createElement('div');
    elTemporaryWrapper.innerHTML = strContent;
    return elTemporaryWrapper.textContent.trim();
}

async function ensureActiveResumeAsync() {
    const objResponse = await fetch('/api/resumes');
    const arrResumes = await parseResumeJsonResponseAsync(objResponse);

    if (arrResumes.length > 0) {
        strActiveResumeID = arrResumes[0].resumeId;
        document.getElementById('txtResumeName').value = arrResumes[0].name;
        return;
    }

    const objCreateResponse = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Tailored Resume' })
    });
    const objCreatedResume = await parseResumeJsonResponseAsync(objCreateResponse);

    strActiveResumeID = objCreatedResume.resumeId;
    document.getElementById('txtResumeName').value = 'Tailored Resume';
}

async function loadResumeSourceDataAsync() {
    const objJobsResponse = await fetch('/api/jobs');
    const objSkillsResponse = await fetch('/api/skills');

    arrResumeAllJobs = await parseResumeJsonResponseAsync(objJobsResponse);
    arrResumeAllSkills = await parseResumeJsonResponseAsync(objSkillsResponse);
    arrResumeAllJobDetails = [];

    // Details are loaded per job because the job-details API intentionally follows the required jobId query pattern.
    for (const objJob of arrResumeAllJobs) {
        const objDetailsResponse = await fetch(`/api/job-details?jobId=${encodeURIComponent(objJob.jobId)}`);
        const arrJobDetails = await parseResumeJsonResponseAsync(objDetailsResponse);
        arrResumeAllJobDetails = arrResumeAllJobDetails.concat(arrJobDetails);
    }
}

async function loadSavedResumeSelectionsAsync() {
    const objJobsResponse = await fetch(`/api/resume-jobs?resumeId=${encodeURIComponent(strActiveResumeID)}`);
    const objDetailsResponse = await fetch(`/api/resume-job-details?resumeId=${encodeURIComponent(strActiveResumeID)}`);
    const objSkillsResponse = await fetch(`/api/resume-skills?resumeId=${encodeURIComponent(strActiveResumeID)}`);

    const arrSelectedJobs = await parseResumeJsonResponseAsync(objJobsResponse);
    const arrSelectedDetails = await parseResumeJsonResponseAsync(objDetailsResponse);
    const arrSelectedSkills = await parseResumeJsonResponseAsync(objSkillsResponse);

    objResumeSelectedJobIDs = new Set(arrSelectedJobs.map((objSelection) => objSelection.jobId));
    objResumeSelectedDetailIDs = new Set(arrSelectedDetails.map((objSelection) => objSelection.detailId));
    objResumeSelectedSkillIDs = new Set(arrSelectedSkills.map((objSelection) => objSelection.skillId));
}

function renderResumeJobsSelection() {
    const elResumeJobs = document.getElementById('divResumeJobs');

    elResumeJobs.innerHTML = '';

    if (arrResumeAllJobs.length === 0) {
        elResumeJobs.textContent = 'Add jobs before building a resume.';
        return;
    }

    arrResumeAllJobs.forEach((objJob) => {
        const elWrapper = document.createElement('div');
        elWrapper.className = 'form-check mb-2';

        const elCheckbox = document.createElement('input');
        elCheckbox.className = 'form-check-input';
        elCheckbox.type = 'checkbox';
        elCheckbox.id = `chkResumeJob${objJob.jobId}`;
        elCheckbox.value = objJob.jobId;
        elCheckbox.checked = objResumeSelectedJobIDs.has(objJob.jobId);
        elCheckbox.setAttribute('aria-label', `Include job ${objJob.jobTitle} at ${objJob.companyName}`);
        elCheckbox.addEventListener('change', () => {
            if (elCheckbox.checked) {
                objResumeSelectedJobIDs.add(objJob.jobId);
            } else {
                objResumeSelectedJobIDs.delete(objJob.jobId);
            }

            renderResumePreview();
        });

        const elLabel = document.createElement('label');
        elLabel.className = 'form-check-label';
        elLabel.setAttribute('for', elCheckbox.id);
        elLabel.textContent = `${objJob.jobTitle} at ${objJob.companyName}`;

        elWrapper.appendChild(elCheckbox);
        elWrapper.appendChild(elLabel);
        elResumeJobs.appendChild(elWrapper);
    });
}

function renderResumeJobDetailsSelection() {
    const elResumeJobDetails = document.getElementById('divResumeJobDetails');

    elResumeJobDetails.innerHTML = '';

    if (arrResumeAllJobDetails.length === 0) {
        elResumeJobDetails.textContent = 'Add responsibilities before building a resume.';
        return;
    }

    arrResumeAllJobDetails.forEach((objJobDetail) => {
        const elWrapper = document.createElement('div');
        elWrapper.className = 'form-check mb-2';

        const elCheckbox = document.createElement('input');
        elCheckbox.className = 'form-check-input';
        elCheckbox.type = 'checkbox';
        elCheckbox.id = `chkResumeDetail${objJobDetail.detailId}`;
        elCheckbox.value = objJobDetail.detailId;
        elCheckbox.checked = objResumeSelectedDetailIDs.has(objJobDetail.detailId);
        elCheckbox.setAttribute('aria-label', 'Include responsibility');
        elCheckbox.addEventListener('change', () => {
            if (elCheckbox.checked) {
                objResumeSelectedDetailIDs.add(objJobDetail.detailId);
            } else {
                objResumeSelectedDetailIDs.delete(objJobDetail.detailId);
            }

            renderResumePreview();
        });

        const elLabel = document.createElement('label');
        elLabel.className = 'form-check-label';
        elLabel.setAttribute('for', elCheckbox.id);
        elLabel.textContent = stripHtml(objJobDetail.content);

        elWrapper.appendChild(elCheckbox);
        elWrapper.appendChild(elLabel);
        elResumeJobDetails.appendChild(elWrapper);
    });
}

function renderResumeSkillsSelection() {
    const elResumeSkills = document.getElementById('divResumeSkills');

    elResumeSkills.innerHTML = '';

    if (arrResumeAllSkills.length === 0) {
        elResumeSkills.textContent = 'Add skills before building a resume.';
        return;
    }

    arrResumeAllSkills.forEach((objSkill) => {
        const elWrapper = document.createElement('div');
        elWrapper.className = 'form-check mb-2';

        const elCheckbox = document.createElement('input');
        elCheckbox.className = 'form-check-input';
        elCheckbox.type = 'checkbox';
        elCheckbox.id = `chkResumeSkill${objSkill.skillId}`;
        elCheckbox.value = objSkill.skillId;
        elCheckbox.checked = objResumeSelectedSkillIDs.has(objSkill.skillId);
        elCheckbox.setAttribute('aria-label', `Include skill ${objSkill.name}`);
        elCheckbox.addEventListener('change', () => {
            if (elCheckbox.checked) {
                objResumeSelectedSkillIDs.add(objSkill.skillId);
            } else {
                objResumeSelectedSkillIDs.delete(objSkill.skillId);
            }

            renderResumePreview();
        });

        const elLabel = document.createElement('label');
        elLabel.className = 'form-check-label';
        elLabel.setAttribute('for', elCheckbox.id);
        elLabel.textContent = `${objSkill.category}: ${objSkill.name}`;

        elWrapper.appendChild(elCheckbox);
        elWrapper.appendChild(elLabel);
        elResumeSkills.appendChild(elWrapper);
    });
}

function renderResumeSelectionControls() {
    renderResumeJobsSelection();
    renderResumeJobDetailsSelection();
    renderResumeSkillsSelection();
}

function renderResumePreview() {
    const elResumePreview = document.getElementById('divResumePreview');
    const strResumeName = document.getElementById('txtResumeName').value.trim() || 'Tailored Resume';
    const arrSelectedJobs = arrResumeAllJobs.filter((objJob) => objResumeSelectedJobIDs.has(objJob.jobId));
    const arrSelectedSkills = arrResumeAllSkills.filter((objSkill) => objResumeSelectedSkillIDs.has(objSkill.skillId));

    elResumePreview.innerHTML = '';

    const elHeading = document.createElement('h2');
    elHeading.className = 'h4';
    elHeading.textContent = strResumeName;
    elResumePreview.appendChild(elHeading);

    if (arrSelectedJobs.length === 0 && arrSelectedSkills.length === 0) {
        const elEmptyMessage = document.createElement('p');
        elEmptyMessage.className = 'mb-0';
        elEmptyMessage.textContent = 'Select jobs, responsibilities, or skills to preview the resume.';
        elResumePreview.appendChild(elEmptyMessage);
        return;
    }

    if (arrSelectedJobs.length > 0) {
        const elExperienceHeading = document.createElement('h3');
        elExperienceHeading.className = 'h5 mt-4';
        elExperienceHeading.textContent = 'Experience';
        elResumePreview.appendChild(elExperienceHeading);
    }

    arrSelectedJobs.forEach((objJob) => {
        const elJobWrapper = document.createElement('section');
        elJobWrapper.className = 'mb-3';

        const elJobHeading = document.createElement('h4');
        elJobHeading.className = 'h6 mb-1';
        elJobHeading.textContent = `${objJob.jobTitle} - ${objJob.companyName}`;

        const elJobDates = document.createElement('p');
        elJobDates.className = 'mb-2';
        elJobDates.textContent = `${objJob.startDate} to ${objJob.endDate || 'Present'}`;

        elJobWrapper.appendChild(elJobHeading);
        elJobWrapper.appendChild(elJobDates);

        arrResumeAllJobDetails
            .filter((objJobDetail) => objJobDetail.jobId === objJob.jobId && objResumeSelectedDetailIDs.has(objJobDetail.detailId))
            .forEach((objJobDetail) => {
                const elDetailWrapper = document.createElement('div');
                elDetailWrapper.innerHTML = objJobDetail.content;
                elJobWrapper.appendChild(elDetailWrapper);
            });

        elResumePreview.appendChild(elJobWrapper);
    });

    if (arrSelectedSkills.length > 0) {
        const elSkillsHeading = document.createElement('h3');
        elSkillsHeading.className = 'h5 mt-4';
        elSkillsHeading.textContent = 'Skills';
        elResumePreview.appendChild(elSkillsHeading);

        const elSkillsList = document.createElement('ul');

        arrSelectedSkills.forEach((objSkill) => {
            const elSkillItem = document.createElement('li');
            elSkillItem.textContent = `${objSkill.category}: ${objSkill.name}`;
            elSkillsList.appendChild(elSkillItem);
        });

        elResumePreview.appendChild(elSkillsList);
    }
}

async function saveResumeSelectionsAsync(objEvent) {
    objEvent.preventDefault();
    clearResumeMessage();

    const strResumeName = document.getElementById('txtResumeName').value.trim();

    if (!strResumeName) {
        showResumeMessage('Resume name is required.', 'danger');
        return;
    }

    const objResumeResponse = await fetch('/api/resumes', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId: strActiveResumeID, name: strResumeName })
    });
    await parseResumeJsonResponseAsync(objResumeResponse);

    const arrSelectedJobIDs = Array.from(objResumeSelectedJobIDs);
    const arrSelectedDetailIDs = Array.from(objResumeSelectedDetailIDs);
    const arrSelectedSkillIDs = Array.from(objResumeSelectedSkillIDs);

    const objJobsResponse = await fetch('/api/resume-jobs', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId: strActiveResumeID, jobIds: arrSelectedJobIDs })
    });
    await parseResumeJsonResponseAsync(objJobsResponse);

    const objDetailsResponse = await fetch('/api/resume-job-details', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId: strActiveResumeID, detailIds: arrSelectedDetailIDs })
    });
    await parseResumeJsonResponseAsync(objDetailsResponse);

    const objSkillsResponse = await fetch('/api/resume-skills', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeId: strActiveResumeID, skillIds: arrSelectedSkillIDs })
    });
    await parseResumeJsonResponseAsync(objSkillsResponse);

    showResumeMessage('Resume selections saved successfully.', 'success');
    renderResumePreview();
}

async function loadResumeBuilderViewAsync() {
    try {
        clearResumeMessage();
        await ensureActiveResumeAsync();
        await loadResumeSourceDataAsync();
        await loadSavedResumeSelectionsAsync();
        renderResumeSelectionControls();
        renderResumePreview();
    } catch (error) {
        showResumeMessage(error.message, 'danger');
    }
}

async function loadResumePreviewViewAsync() {
    await ensureActiveResumeAsync();
    await loadResumeSourceDataAsync();
    await loadSavedResumeSelectionsAsync();
    renderResumePreview();
}

function initializeResume() {
    const elResumeForm = document.getElementById('formResume');
    const elResumeName = document.getElementById('txtResumeName');

    // The builder saves checkbox selections to join tables, then the same in-memory selection renders a live preview.
    elResumeForm.addEventListener('submit', async (objEvent) => {
        try {
            await saveResumeSelectionsAsync(objEvent);
        } catch (error) {
            showResumeMessage(error.message, 'danger');
        }
    });

    elResumeName.addEventListener('input', () => {
        renderResumePreview();
    });
}

window.loadResumeBuilderViewAsync = loadResumeBuilderViewAsync;
window.loadResumePreviewViewAsync = loadResumePreviewViewAsync;
document.addEventListener('DOMContentLoaded', initializeResume);
