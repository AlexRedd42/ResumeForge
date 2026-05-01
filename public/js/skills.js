let arrSkills = [];

function showSkillsMessage(strMessage, strType) {
    const elMessage = document.getElementById('divSkillsMessage');

    elMessage.textContent = strMessage;
    elMessage.className = `alert alert-${strType}`;
}

function clearSkillsMessage() {
    const elMessage = document.getElementById('divSkillsMessage');

    elMessage.textContent = '';
    elMessage.className = 'alert d-none';
}

async function parseSkillsJsonResponseAsync(objResponse) {
    const objData = await objResponse.json();

    if (!objResponse.ok) {
        throw new Error(objData.message || 'Request failed');
    }

    return objData;
}

function groupSkillsByCategory() {
    const objGroupedSkills = {};

    arrSkills.forEach((objSkill) => {
        if (!objGroupedSkills[objSkill.category]) {
            objGroupedSkills[objSkill.category] = [];
        }

        objGroupedSkills[objSkill.category].push(objSkill);
    });

    return objGroupedSkills;
}

function renderSkillsList() {
    const elSkillsList = document.getElementById('divSkillsList');
    const objGroupedSkills = groupSkillsByCategory();
    const arrCategories = Object.keys(objGroupedSkills);

    elSkillsList.innerHTML = '';

    if (arrSkills.length === 0) {
        const elEmptyMessage = document.createElement('p');
        elEmptyMessage.className = 'mb-0';
        elEmptyMessage.textContent = 'No skills have been added yet.';
        elSkillsList.appendChild(elEmptyMessage);
        return;
    }

    arrCategories.forEach((strCategory) => {
        const elCategoryWrapper = document.createElement('div');
        elCategoryWrapper.className = 'mb-4';

        const elCategoryHeading = document.createElement('h3');
        elCategoryHeading.className = 'h6 text-uppercase';
        elCategoryHeading.textContent = strCategory;

        const elSkillListGroup = document.createElement('ul');
        elSkillListGroup.className = 'list-group';

        objGroupedSkills[strCategory].forEach((objSkill) => {
            const elSkillItem = document.createElement('li');
            elSkillItem.className = 'list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2';

            const elSkillName = document.createElement('span');
            elSkillName.textContent = objSkill.name;

            const elDeleteButton = document.createElement('button');
            elDeleteButton.type = 'button';
            elDeleteButton.className = 'btn btn-outline-danger btn-sm';
            elDeleteButton.textContent = 'Delete';
            elDeleteButton.setAttribute('aria-label', `Delete skill ${objSkill.name}`);
            elDeleteButton.addEventListener('click', async () => {
                await deleteSkillAsync(objSkill.skillId);
            });

            elSkillItem.appendChild(elSkillName);
            elSkillItem.appendChild(elDeleteButton);
            elSkillListGroup.appendChild(elSkillItem);
        });

        elCategoryWrapper.appendChild(elCategoryHeading);
        elCategoryWrapper.appendChild(elSkillListGroup);
        elSkillsList.appendChild(elCategoryWrapper);
    });
}

async function loadSkillsAsync() {
    const objResponse = await fetch('/api/skills');
    arrSkills = await parseSkillsJsonResponseAsync(objResponse);
    renderSkillsList();
}

async function saveSkillAsync(objEvent) {
    objEvent.preventDefault();
    clearSkillsMessage();

    const elForm = document.getElementById('formSkill');
    const objFormData = new FormData(elForm);
    const objSkill = {
        name: objFormData.get('name').trim(),
        category: objFormData.get('category').trim()
    };

    if (!objSkill.name || !objSkill.category) {
        showSkillsMessage('Skill name and category are required.', 'danger');
        return;
    }

    const objResponse = await fetch('/api/skills', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objSkill)
    });

    await parseSkillsJsonResponseAsync(objResponse);

    elForm.reset();
    showSkillsMessage('Skill saved successfully.', 'success');
    await loadSkillsAsync();
}

async function deleteSkillAsync(strSkillID) {
    clearSkillsMessage();

    const objResponse = await fetch(`/api/skills/${encodeURIComponent(strSkillID)}`, {
        method: 'DELETE'
    });

    await parseSkillsJsonResponseAsync(objResponse);
    showSkillsMessage('Skill deleted successfully.', 'success');
    await loadSkillsAsync();
}

async function loadSkillsViewAsync() {
    try {
        await loadSkillsAsync();
    } catch (error) {
        showSkillsMessage(error.message, 'danger');
    }
}

function initializeSkills() {
    const elSkillForm = document.getElementById('formSkill');

    // The skills form posts JSON to the API and then redraws the grouped list from the database.
    elSkillForm.addEventListener('submit', async (objEvent) => {
        try {
            await saveSkillAsync(objEvent);
        } catch (error) {
            showSkillsMessage(error.message, 'danger');
        }
    });
}

window.loadSkillsViewAsync = loadSkillsViewAsync;
document.addEventListener('DOMContentLoaded', initializeSkills);
