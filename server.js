const objExpress = require('express');
const objPath = require('path');
require('dotenv').config();

const objJobsRouter = require('./api/jobs');
const objJobDetailsRouter = require('./api/job-details');
const objSkillsRouter = require('./api/skills');
const objResumesRouter = require('./api/resumes');
const objResumeJobsRouter = require('./api/resume-jobs');
const objResumeJobDetailsRouter = require('./api/resume-job-details');
const objResumeSkillsRouter = require('./api/resume-skills');
const objPersonalInfoRouter = require('./api/personal-info');
const objAiRouter = require('./api/ai');
require('./db/database');

const appResumeForge = objExpress();
const intPort = process.env.PORT || 3000;

// Allow the backend to read JSON data sent from the browser through fetch.
appResumeForge.use(objExpress.json());

// Serve the single-page application and all local frontend files from /public.
appResumeForge.use(objExpress.static(objPath.join(__dirname, 'public')));

// Serve approved local vendor files, such as Bootstrap, without using a CDN.
appResumeForge.use('/vendor', objExpress.static(objPath.join(__dirname, 'vendor')));

// Keep every application API route under /api so the frontend has one clear API root.
appResumeForge.use('/api/jobs', objJobsRouter);
appResumeForge.use('/api/job-details', objJobDetailsRouter);
appResumeForge.use('/api/skills', objSkillsRouter);
appResumeForge.use('/api/resumes', objResumesRouter);
appResumeForge.use('/api/resume-jobs', objResumeJobsRouter);
appResumeForge.use('/api/resume-job-details', objResumeJobDetailsRouter);
appResumeForge.use('/api/resume-skills', objResumeSkillsRouter);
appResumeForge.use('/api/personal-info', objPersonalInfoRouter);
appResumeForge.use('/api/ai', objAiRouter);

// Send the SPA shell for the site root. Future client-side navigation stays in index.html.
appResumeForge.get('/', (req, res) => {
    res.status(200).sendFile(objPath.join(__dirname, 'public', 'index.html'));
});

appResumeForge.listen(intPort, () => {
    console.log(`ResumeForge server running at http://localhost:${intPort}`);
});
