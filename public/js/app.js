const objViews = {
    dashboard: 'sectionDashboard',
    jobs: 'sectionJobs',
    skills: 'sectionSkills',
    builder: 'sectionBuilder',
    preview: 'sectionPreview'
};

function getRequestedView() {
    const strHashValue = window.location.hash.replace('#', '');

    if (objViews[strHashValue]) {
        return strHashValue;
    }

    return 'dashboard';
}

function setActiveNavigation(strViewName) {
    const arrNavigationLinks = document.querySelectorAll('[data-view]');

    // Navigation state is updated whenever the hash changes so keyboard and screen reader users know the current view.
    arrNavigationLinks.forEach((elNavigationLink) => {
        const boolIsCurrentView = elNavigationLink.dataset.view === strViewName;
        elNavigationLink.classList.toggle('active', boolIsCurrentView);

        if (boolIsCurrentView) {
            elNavigationLink.setAttribute('aria-current', 'page');
        } else {
            elNavigationLink.removeAttribute('aria-current');
        }
    });
}

async function loadActiveViewDataAsync(strViewName) {
    if (strViewName === 'jobs' && window.loadJobsViewAsync) {
        await window.loadJobsViewAsync();
    }

    if (strViewName === 'skills' && window.loadSkillsViewAsync) {
        await window.loadSkillsViewAsync();
    }

    if (strViewName === 'builder' && window.loadResumeBuilderViewAsync) {
        await window.loadResumeBuilderViewAsync();
    }

    if (strViewName === 'preview' && window.loadResumePreviewViewAsync) {
        await window.loadResumePreviewViewAsync();
    }
}

async function renderViewAsync(strViewName) {
    const arrSections = document.querySelectorAll('[data-section]');
    const elMainContent = document.getElementById('mainContent');

    // The SPA keeps all view markup in index.html and switches visibility with Bootstrap utility classes.
    arrSections.forEach((elSection) => {
        const boolIsCurrentSection = elSection.dataset.section === strViewName;
        elSection.classList.toggle('d-none', !boolIsCurrentSection);
    });

    setActiveNavigation(strViewName);
    await loadActiveViewDataAsync(strViewName);
    elMainContent.focus();
}

async function handleRouteChangeAsync() {
    const strViewName = getRequestedView();
    await renderViewAsync(strViewName);
}

window.addEventListener('hashchange', async () => {
    await handleRouteChangeAsync();
});

document.addEventListener('DOMContentLoaded', async () => {
    await handleRouteChangeAsync();
});
