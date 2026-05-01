const objExpress = require('express');
const objCrypto = require('crypto');
const { runAsync, getAsync, allAsync } = require('../db/database');

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
        const strJobID = sanitizeString(req.query.jobid);

        // SELECT inputs come from the query string. If jobid is present, return only that job.
        if (strJobID) {
            const strQuery = `
                SELECT
                    JobID AS jobid,
                    CompanyName AS companyname,
                    JobTitle AS jobtitle,
                    StartDate AS startdate,
                    EndDate AS enddate,
                    Location AS location,
                    CreatedAt AS createdat
                FROM tblJobs
                WHERE JobID = ?
            `;

            const objJob = await getAsync(strQuery, [strJobID]);

            if (!objJob) {
                return res.status(404).json({ outcome: "error", message: "Job not found" });
            }

            return res.status(200).json({ outcome: "success", message: objJob });
        }

        const strQuery = `
            SELECT
                JobID AS jobid,
                CompanyName AS companyname,
                JobTitle AS jobtitle,
                StartDate AS startdate,
                EndDate AS enddate,
                Location AS location,
                CreatedAt AS createdat
            FROM tblJobs
            ORDER BY StartDate DESC, CreatedAt DESC
        `;

        const arrJobs = await allAsync(strQuery, []);
        return res.status(200).json({ outcome: "success", message: arrJobs });
    } catch (error) {
        console.error('GET /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.post('/', async (req, res) => {
    try {
        const strJobID = objCrypto.randomUUID();
        const strCompanyName = sanitizeString(req.body.companyname);
        const strJobTitle = sanitizeString(req.body.jobtitle);
        const strStartDate = sanitizeString(req.body.startdate);
        const strEndDate = sanitizeString(req.body.enddate);
        const strLocation = sanitizeString(req.body.location);
        const strCreatedAt = new Date().toISOString();

        // CREATE inputs must be sent in the JSON body and all required fields are validated before SQL runs.
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
            INSERT INTO tblJobs
                (JobID, CompanyName, JobTitle, StartDate, EndDate, Location, CreatedAt)
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
        `;

        await runAsync(strQuery, [
            strJobID,
            strCompanyName,
            strJobTitle,
            strStartDate,
            strEndDate,
            strLocation,
            strCreatedAt
        ]);

        return res.status(201).json({ outcome: "success", message: `Inserted job with id ${strJobID}`, jobid: strJobID });
    } catch (error) {
        console.error('POST /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.put('/', async (req, res) => {
    try {
        const strJobID = sanitizeString(req.body.jobid);
        const strCompanyName = sanitizeString(req.body.companyname);
        const strJobTitle = sanitizeString(req.body.jobtitle);
        const strStartDate = sanitizeString(req.body.startdate);
        const strEndDate = sanitizeString(req.body.enddate);
        const strLocation = sanitizeString(req.body.location);

        // UPDATE uses PUT and requires the primary key plus the complete set of editable fields.
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
            UPDATE tblJobs
            SET CompanyName = ?,
                JobTitle = ?,
                StartDate = ?,
                EndDate = ?,
                Location = ?
            WHERE JobID = ?
        `;

        const objResult = await runAsync(strQuery, [
            strCompanyName,
            strJobTitle,
            strStartDate,
            strEndDate,
            strLocation,
            strJobID
        ]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        return res.status(200).json({ outcome: "success", message: `Updated job with id ${strJobID}` });
    } catch (error) {
        console.error('PUT /api/jobs error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobsRouter.delete('/:jobid', async (req, res) => {
    try {
        const strJobID = sanitizeString(req.params.jobid);

        if (!strJobID) {
            return res.status(400).json({ outcome: "error", message: "Job ID must be provided" });
        }

        const strQuery = "DELETE FROM tblJobs WHERE JobID = ?";
        const objResult = await runAsync(strQuery, [strJobID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        return res.status(200).json({ outcome: "success", message: `Deleted job with id ${strJobID}` });
    } catch (error) {
        console.error('DELETE /api/jobs/:jobid error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objJobsRouter;
