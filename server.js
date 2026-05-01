const objExpress = require('express');
const objPath = require('path');
require('dotenv').config();

const objJobsRouter = require('./api/jobs');
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

// Send the SPA shell for the site root. Future client-side navigation stays in index.html.
appResumeForge.get('/', (req, res) => {
    res.status(200).sendFile(objPath.join(__dirname, 'public', 'index.html'));
});

appResumeForge.listen(intPort, () => {
    console.log(`ResumeForge server running at http://localhost:${intPort}`);
});
