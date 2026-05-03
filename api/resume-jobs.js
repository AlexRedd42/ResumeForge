const objExpress = require('express');
const { runAsync, allAsync } = require('../db/database');

const objResumeJobsRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

function sanitizeArray(arrValues) {
    if (!Array.isArray(arrValues)) {
        return [];
    }

    return arrValues.map((strValue) => sanitizeString(strValue)).filter((strValue) => strValue);
}

objResumeJobsRouter.get('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.query.resumeId);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        const strQuery = "SELECT resume_id AS resumeId, job_id AS jobId FROM resume_jobs WHERE resume_id = ?";
        const arrResumeJobs = await allAsync(strQuery, [strResumeID]);

        return res.status(200).json(arrResumeJobs);
    } catch (error) {
        console.error('GET /api/resume-jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumeJobsRouter.put('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.body.resumeId);
        const arrJobIDs = sanitizeArray(req.body.jobIds);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        await runAsync("DELETE FROM resume_jobs WHERE resume_id = ?", [strResumeID]);

        for (const strJobID of arrJobIDs) {
            await runAsync("INSERT OR IGNORE INTO resume_jobs (resume_id, job_id) VALUES (?, ?)", [strResumeID, strJobID]);
        }

        return res.status(200).json({ outcome: "success", message: "Resume jobs updated successfully" });
    } catch (error) {
        console.error('PUT /api/resume-jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objResumeJobsRouter;
