let strActiveResumeID = '';
let arrResumeAllJobs = [];
let arrResumeAllJobDetails = [];
let arrResumeAllSkills = [];
let objResumePersonalInfo = {
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    schoolName: '',
    major: '',
    gpa: ''
};
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

function getDisplayEndDate(strEndDate) {
    if (!strEndDate) {
        return 'Present';
    }

    if (strEndDate.toLowerCase() === 'present') {
        return 'Present';
    }

    return strEndDate;
}

function getBulletTextsFromContent(strContent) {
    const elTemporaryWrapper = document.createElement('div');
    elTemporaryWrapper.innerHTML = strContent;

    const arrListItems = Array.from(elTemporaryWrapper.querySelectorAll('li'))
        .map((elListItem) => elListItem.textContent.trim())
        .filter((strText) => strText);

    if (arrListItems.length > 0) {
        return arrListItems;
    }

    const arrBlockItems = Array.from(elTemporaryWrapper.querySelectorAll('p, div'))
        .map((elBlockItem) => elBlockItem.textContent.trim())
        .filter((strText) => strText);

    if (arrBlockItems.length > 0) {
        return arrBlockItems;
    }

    const strPlainText = elTemporaryWrapper.textContent.trim();
    return strPlainText ? [strPlainText] : [];
}

async function ensureActiveResumeAsync() {
    const objResponse = await fetch('/api/resumes');
    const arrResumes = await parseResumeJsonResponseAsync(objResponse);

    if (arrResumes.length > 0) {
        strActiveResumeID = arrResumes[0].resumeId;
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

async function loadResumePersonalInfoAsync() {
    const objResponse = await fetch('/api/personal-info');
    objResumePersonalInfo = await parseResumeJsonResponseAsync(objResponse);
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
    const arrSelectedJobs = arrResumeAllJobs.filter((objJob) => objResumeSelectedJobIDs.has(objJob.jobId));
    const arrSelectedSkills = arrResumeAllSkills.filter((objSkill) => objResumeSelectedSkillIDs.has(objSkill.skillId));
    const arrContactItems = [objResumePersonalInfo.email, objResumePersonalInfo.phone, objResumePersonalInfo.linkedin].filter((strValue) => strValue);
    const boolHasEducation = !!objResumePersonalInfo.schoolName;

    elResumePreview.innerHTML = '';

    const elHeaderSection = document.createElement('section');
    elHeaderSection.className = 'text-center border-bottom pb-3 mb-4';

    const elNameHeading = document.createElement('h1');
    elNameHeading.className = 'display-6 fw-bold mb-1';
    elNameHeading.textContent = objResumePersonalInfo.fullName || 'Resume';

    const elContactLine = document.createElement('p');
    elContactLine.className = 'mb-0';
    elContactLine.textContent = arrContactItems.join(' | ');

    elHeaderSection.appendChild(elNameHeading);

    if (arrContactItems.length > 0) {
        elHeaderSection.appendChild(elContactLine);
    }

    elResumePreview.appendChild(elHeaderSection);

    if (arrSelectedJobs.length === 0 && arrSelectedSkills.length === 0 && !boolHasEducation) {
        const elEmptyMessage = document.createElement('p');
        elEmptyMessage.className = 'mb-0';
        elEmptyMessage.textContent = 'Select jobs, responsibilities, or skills to preview the resume.';
        elResumePreview.appendChild(elEmptyMessage);
        return;
    }

    if (boolHasEducation) {
        const elEducationSection = document.createElement('section');
        elEducationSection.setAttribute('aria-labelledby', 'headingPreviewEducation');

        const elEducationHeading = document.createElement('h2');
        elEducationHeading.className = 'h5 text-uppercase border-bottom pb-1';
        elEducationHeading.id = 'headingPreviewEducation';
        elEducationHeading.textContent = 'Education';

        const elSchoolName = document.createElement('p');
        elSchoolName.className = 'fw-bold mb-1';
        elSchoolName.textContent = objResumePersonalInfo.schoolName;

        elEducationSection.appendChild(elEducationHeading);
        elEducationSection.appendChild(elSchoolName);

        if (objResumePersonalInfo.major) {
            const elMajor = document.createElement('p');
            elMajor.className = 'mb-1';
            elMajor.textContent = objResumePersonalInfo.major;
            elEducationSection.appendChild(elMajor);
        }

        if (objResumePersonalInfo.gpa) {
            const elGpa = document.createElement('p');
            elGpa.className = 'mb-3';
            elGpa.textContent = `GPA: ${objResumePersonalInfo.gpa}`;
            elEducationSection.appendChild(elGpa);
        }

        elResumePreview.appendChild(elEducationSection);
    }

    if (arrSelectedJobs.length > 0) {
        const elExperienceSection = document.createElement('section');
        elExperienceSection.setAttribute('aria-labelledby', 'headingPreviewExperience');

        const elExperienceHeading = document.createElement('h3');
        elExperienceHeading.className = 'h5 text-uppercase border-bottom pb-1';
        elExperienceHeading.id = 'headingPreviewExperience';
        elExperienceHeading.textContent = 'Experience';
        elExperienceSection.appendChild(elExperienceHeading);

        arrSelectedJobs.forEach((objJob) => {
            const elJobWrapper = document.createElement('section');
            elJobWrapper.className = 'mb-3';

            const elJobHeading = document.createElement('h4');
            elJobHeading.className = 'h6 fw-bold mb-1';
            elJobHeading.textContent = objJob.jobTitle;

            const elJobDates = document.createElement('p');
            elJobDates.className = 'mb-2';
            elJobDates.textContent = `${objJob.companyName} | ${objJob.startDate} to ${getDisplayEndDate(objJob.endDate)}`;

            elJobWrapper.appendChild(elJobHeading);
            elJobWrapper.appendChild(elJobDates);

            const elDetailList = document.createElement('ul');

            arrResumeAllJobDetails
                .filter((objJobDetail) => objJobDetail.jobId === objJob.jobId && objResumeSelectedDetailIDs.has(objJobDetail.detailId))
                .forEach((objJobDetail) => {
                    const arrBulletTexts = getBulletTextsFromContent(objJobDetail.content);

                    arrBulletTexts.forEach((strBulletText) => {
                        const elDetailItem = document.createElement('li');
                        elDetailItem.textContent = strBulletText;
                        elDetailList.appendChild(elDetailItem);
                    });
                });

            if (elDetailList.children.length > 0) {
                elJobWrapper.appendChild(elDetailList);
            }

            elExperienceSection.appendChild(elJobWrapper);
        });

        elResumePreview.appendChild(elExperienceSection);
    }

    if (arrSelectedSkills.length > 0) {
        const elSkillsSection = document.createElement('section');
        elSkillsSection.setAttribute('aria-labelledby', 'headingPreviewSkills');

        const elSkillsHeading = document.createElement('h3');
        elSkillsHeading.className = 'h5 text-uppercase border-bottom pb-1 mt-4';
        elSkillsHeading.id = 'headingPreviewSkills';
        elSkillsHeading.textContent = 'Skills';
        elSkillsSection.appendChild(elSkillsHeading);

        const objGroupedSkills = {};

        arrSelectedSkills.forEach((objSkill) => {
            if (!objGroupedSkills[objSkill.category]) {
                objGroupedSkills[objSkill.category] = [];
            }

            objGroupedSkills[objSkill.category].push(objSkill.name);
        });

        Object.keys(objGroupedSkills).forEach((strCategory) => {
            const elSkillGroup = document.createElement('p');
            elSkillGroup.className = 'mb-1';

            const elCategoryName = document.createElement('strong');
            elCategoryName.textContent = `${strCategory}: `;

            const elSkillNames = document.createTextNode(objGroupedSkills[strCategory].join(', '));

            elSkillGroup.appendChild(elCategoryName);
            elSkillGroup.appendChild(elSkillNames);
            elSkillsSection.appendChild(elSkillGroup);
        });

        elResumePreview.appendChild(elSkillsSection);
    }
}

async function saveResumeSelectionsAsync(objEvent) {
    objEvent.preventDefault();
    clearResumeMessage();

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
        await loadResumePersonalInfoAsync();
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
    await loadResumePersonalInfoAsync();
    await loadResumeSourceDataAsync();
    await loadSavedResumeSelectionsAsync();
    renderResumePreview();
}

function initializeResume() {
    const elResumeForm = document.getElementById('formResume');
    const elPrintResumeButton = document.getElementById('btnPrintResume');

    // The builder saves checkbox selections to join tables, then the same in-memory selection renders a live preview.
    elResumeForm.addEventListener('submit', async (objEvent) => {
        try {
            await saveResumeSelectionsAsync(objEvent);
        } catch (error) {
            showResumeMessage(error.message, 'danger');
        }
    });

    elPrintResumeButton.addEventListener('click', () => {
        window.print();
    });
}

window.loadResumeBuilderViewAsync = loadResumeBuilderViewAsync;
window.loadResumePreviewViewAsync = loadResumePreviewViewAsync;
document.addEventListener('DOMContentLoaded', initializeResume);
