const objViews = {
    dashboard: {
        strHeadingID: 'headingDashboard',
        strHeading: 'ResumeForge Dashboard',
        strBody: 'Use the navigation to manage resume content and prepare a tailored resume.'
    },
    jobs: {
        strHeadingID: 'headingJobs',
        strHeading: 'Job Management',
        strBody: 'The jobs API starter route is ready. Job forms and responsibility details will be added in the next step.'
    },
    skills: {
        strHeadingID: 'headingSkills',
        strHeading: 'Skills, Certifications, and Awards',
        strBody: 'This section will store categorized skills, certifications, and awards.'
    },
    builder: {
        strHeadingID: 'headingBuilder',
        strHeading: 'Resume Builder',
        strBody: 'This section will let users select jobs, details, skills, certifications, and awards for a tailored resume.'
    },
    preview: {
        strHeadingID: 'headingPreview',
        strHeading: 'Resume Preview',
        strBody: 'This section will display web and print-friendly resume layouts.'
    }
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

    // Each navigation link is updated so screen readers and sighted users receive the same active-state cue.
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

function renderView(strViewName) {
    const objView = objViews[strViewName];
    const elMainContent = document.getElementById('mainContent');

    // The SPA swaps a small semantic section into the main landmark instead of loading a new page.
    elMainContent.innerHTML = `
        <section class="row justify-content-center" aria-labelledby="${objView.strHeadingID}">
            <div class="col-12 col-lg-10">
                <div class="card">
                    <div class="card-body">
                        <h1 class="h3" id="${objView.strHeadingID}">${objView.strHeading}</h1>
                        <p class="mb-0">${objView.strBody}</p>
                    </div>
                </div>
            </div>
        </section>
    `;

    setActiveNavigation(strViewName);
    elMainContent.focus();
}

function handleRouteChange() {
    const strViewName = getRequestedView();
    renderView(strViewName);
}

window.addEventListener('hashchange', handleRouteChange);
document.addEventListener('DOMContentLoaded', handleRouteChange);
