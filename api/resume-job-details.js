const objExpress = require('express');
const { runAsync, allAsync } = require('../db/database');

const objResumeJobDetailsRouter = objExpress.Router();

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

objResumeJobDetailsRouter.get('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.query.resumeId);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        const strQuery = "SELECT resume_id AS resumeId, detail_id AS detailId FROM resume_job_details WHERE resume_id = ?";
        const arrResumeJobDetails = await allAsync(strQuery, [strResumeID]);

        return res.status(200).json(arrResumeJobDetails);
    } catch (error) {
        console.error('GET /api/resume-job-details error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumeJobDetailsRouter.put('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.body.resumeId);
        const arrDetailIDs = sanitizeArray(req.body.detailIds);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        await runAsync("DELETE FROM resume_job_details WHERE resume_id = ?", [strResumeID]);

        for (const strDetailID of arrDetailIDs) {
            await runAsync("INSERT OR IGNORE INTO resume_job_details (resume_id, detail_id) VALUES (?, ?)", [strResumeID, strDetailID]);
        }

        return res.status(200).json({ outcome: "success", message: "Resume job details updated successfully" });
    } catch (error) {
        console.error('PUT /api/resume-job-details error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objResumeJobDetailsRouter;
