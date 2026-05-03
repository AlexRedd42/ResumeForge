function showPersonalMessage(strMessage, strType) {
    const elMessage = document.getElementById('divPersonalMessage');

    elMessage.textContent = strMessage;
    elMessage.className = `alert alert-${strType}`;
}

function clearPersonalMessage() {
    const elMessage = document.getElementById('divPersonalMessage');

    elMessage.textContent = '';
    elMessage.className = 'alert d-none';
}

async function parsePersonalJsonResponseAsync(objResponse) {
    const objData = await objResponse.json();

    if (!objResponse.ok) {
        throw new Error(objData.message || 'Request failed');
    }

    return objData;
}

function fillPersonalForm(objPersonalInfo) {
    document.getElementById('txtFullName').value = objPersonalInfo.fullName || '';
    document.getElementById('txtEmail').value = objPersonalInfo.email || '';
    document.getElementById('txtPhone').value = objPersonalInfo.phone || '';
    document.getElementById('txtLinkedIn').value = objPersonalInfo.linkedin || '';
    document.getElementById('txtSchoolName').value = objPersonalInfo.schoolName || '';
    document.getElementById('txtMajor').value = objPersonalInfo.major || '';
    document.getElementById('txtGpa').value = objPersonalInfo.gpa || '';
}

async function loadPersonalInfoAsync() {
    const objResponse = await fetch('/api/personal-info');
    const objPersonalInfo = await parsePersonalJsonResponseAsync(objResponse);
    fillPersonalForm(objPersonalInfo);
    return objPersonalInfo;
}

async function savePersonalInfoAsync(objEvent) {
    objEvent.preventDefault();
    clearPersonalMessage();

    const objPersonalInfo = {
        fullName: document.getElementById('txtFullName').value.trim(),
        email: document.getElementById('txtEmail').value.trim(),
        phone: document.getElementById('txtPhone').value.trim(),
        linkedin: document.getElementById('txtLinkedIn').value.trim(),
        schoolName: document.getElementById('txtSchoolName').value.trim(),
        major: document.getElementById('txtMajor').value.trim(),
        gpa: document.getElementById('txtGpa').value.trim()
    };

    const objResponse = await fetch('/api/personal-info', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objPersonalInfo)
    });

    await parsePersonalJsonResponseAsync(objResponse);
    showPersonalMessage('Personal information saved successfully.', 'success');
}

async function loadPersonalInfoViewAsync() {
    try {
        clearPersonalMessage();
        await loadPersonalInfoAsync();
    } catch (error) {
        showPersonalMessage(error.message, 'danger');
    }
}

function initializePersonalInfo() {
    const elPersonalInfoForm = document.getElementById('formPersonalInfo');

    // The personal information form always saves to the single database row with id 1.
    elPersonalInfoForm.addEventListener('submit', async (objEvent) => {
        try {
            await savePersonalInfoAsync(objEvent);
        } catch (error) {
            showPersonalMessage(error.message, 'danger');
        }
    });
}

window.loadPersonalInfoAsync = loadPersonalInfoAsync;
window.loadPersonalInfoViewAsync = loadPersonalInfoViewAsync;
document.addEventListener('DOMContentLoaded', initializePersonalInfo);
