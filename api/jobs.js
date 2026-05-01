const objExpress = require('express');
const objCrypto = require('crypto');
const { runAsync, allAsync } = require('../db/database');

const objJobsRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

function isValidDateString(strValue) {
    if (!strValue) {
        return false;
    }

    const objDate = new Date(strValue);
    return !Number.isNaN(objDate.getTime());
}

objJobsRouter.get('/', async (req, res) => {
    try {
        const strQuery = `
            SELECT
                job_id AS jobId,
                company_name AS companyName,
                job_title AS jobTitle,
                start_date AS startDate,
                end_date AS endDate
            FROM jobs
            ORDER BY start_date DESC, company_name ASC
        `;

        const arrJobs = await allAsync(strQuery, []);
        return res.status(200).json(arrJobs);
    } catch (error) {
        console.error('GET /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.post('/', async (req, res) => {
    try {
        const strJobID = objCrypto.randomUUID();
        const strCompanyName = sanitizeString(req.body.companyName);
        const strJobTitle = sanitizeString(req.body.jobTitle);
        const strStartDate = sanitizeString(req.body.startDate);
        const strEndDate = sanitizeString(req.body.endDate);

        // Validate every required field before building the prepared SQL statement.
        if (!strCompanyName || !strJobTitle || !strStartDate) {
            return res.status(400).json({ outcome: "error", message: "Company name, job title, and start date must be provided" });
        }

        if (!isValidDateString(strStartDate)) {
            return res.status(400).json({ outcome: "error", message: "Start date must be a valid date" });
        }

        if (strEndDate && !isValidDateString(strEndDate)) {
            return res.status(400).json({ outcome: "error", message: "End date must be a valid date" });
        }

        const strQuery = `
            INSERT INTO jobs
                (job_id, company_name, job_title, start_date, end_date)
            VALUES
                (?, ?, ?, ?, ?)
        `;

        await runAsync(strQuery, [strJobID, strCompanyName, strJobTitle, strStartDate, strEndDate]);

        return res.status(201).json({ outcome: "success", message: "Job created successfully", jobId: strJobID });
    } catch (error) {
        console.error('POST /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.put('/', async (req, res) => {
    try {
        const strJobID = sanitizeString(req.body.jobId);
        const strCompanyName = sanitizeString(req.body.companyName);
        const strJobTitle = sanitizeString(req.body.jobTitle);
        const strStartDate = sanitizeString(req.body.startDate);
        const strEndDate = sanitizeString(req.body.endDate);

        // PUT requires the primary key and complete editable job values.
        if (!strJobID || !strCompanyName || !strJobTitle || !strStartDate) {
            return res.status(400).json({ outcome: "error", message: "Job ID, company name, job title, and start date must be provided" });
        }

        if (!isValidDateString(strStartDate)) {
            return res.status(400).json({ outcome: "error", message: "Start date must be a valid date" });
        }

        if (strEndDate && !isValidDateString(strEndDate)) {
            return res.status(400).json({ outcome: "error", message: "End date must be a valid date" });
        }

        const strQuery = `
            UPDATE jobs
            SET company_name = ?,
                job_title = ?,
                start_date = ?,
                end_date = ?
            WHERE job_id = ?
        `;

        const objResult = await runAsync(strQuery, [strCompanyName, strJobTitle, strStartDate, strEndDate, strJobID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Job updated successfully" });
    } catch (error) {
        console.error('PUT /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.delete('/:jobId', async (req, res) => {
    try {
        const strJobID = sanitizeString(req.params.jobId);

        if (!strJobID) {
            return res.status(400).json({ outcome: "error", message: "Job ID must be provided" });
        }

        const strQuery = "DELETE FROM jobs WHERE job_id = ?";
        const objResult = await runAsync(strQuery, [strJobID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Job deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/jobs/:jobId error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objJobsRouter;
