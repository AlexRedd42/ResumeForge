const objExpress = require('express');
const objCrypto = require('crypto');
const { runAsync, getAsync, allAsync } = require('../db/database');

const objJobDetailsRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

function isContentEmpty(strContent) {
    const strPlainText = strContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return !strPlainText;
}

objJobDetailsRouter.get('/', async (req, res) => {
    try {
        const strJobID = sanitizeString(req.query.jobId);

        if (!strJobID) {
            return res.status(400).json({ outcome: "error", message: "Job ID must be provided" });
        }

        const strQuery = `
            SELECT
                detail_id AS detailId,
                job_id AS jobId,
                content AS content,
                created_at AS createdAt
            FROM job_details
            WHERE job_id = ?
            ORDER BY created_at ASC, rowid ASC
        `;

        const arrJobDetails = await allAsync(strQuery, [strJobID]);
        return res.status(200).json(arrJobDetails);
    } catch (error) {
        console.error('GET /api/job-details error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobDetailsRouter.post('/', async (req, res) => {
    try {
        const strDetailID = objCrypto.randomUUID();
        const strJobID = sanitizeString(req.body.jobId);
        const strContent = sanitizeString(req.body.content);
        const strCreatedAt = new Date().toISOString();

        // Quill HTML is stored as TEXT so formatting is preserved for later resume preview rendering.
        if (!strJobID || !strContent || isContentEmpty(strContent)) {
            return res.status(400).json({ outcome: "error", message: "Job ID and formatted content must be provided" });
        }

        const strFindJobQuery = "SELECT job_id FROM jobs WHERE job_id = ?";
        const objJob = await getAsync(strFindJobQuery, [strJobID]);

        if (!objJob) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        const strQuery = `
            INSERT INTO job_details
                (detail_id, job_id, content, created_at)
            VALUES
                (?, ?, ?, ?)
        `;

        await runAsync(strQuery, [strDetailID, strJobID, strContent, strCreatedAt]);

        return res.status(201).json({ outcome: "success", message: "Job detail created successfully", detailId: strDetailID });
    } catch (error) {
        console.error('POST /api/job-details error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobDetailsRouter.put('/', async (req, res) => {
    try {
        const strDetailID = sanitizeString(req.body.detailId);
        const strJobID = sanitizeString(req.body.jobId);
        const strContent = sanitizeString(req.body.content);

        if (!strDetailID || !strJobID || !strContent || isContentEmpty(strContent)) {
            return res.status(400).json({ outcome: "error", message: "Detail ID, job ID, and formatted content must be provided" });
        }

        const strFindJobQuery = "SELECT job_id FROM jobs WHERE job_id = ?";
        const objJob = await getAsync(strFindJobQuery, [strJobID]);

        if (!objJob) {
            return res.status(404).json({ outcome: "error", message: "Job not found" });
        }

        const strQuery = `
            UPDATE job_details
            SET job_id = ?,
                content = ?
            WHERE detail_id = ?
        `;

        const objResult = await runAsync(strQuery, [strJobID, strContent, strDetailID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job detail not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Job detail updated successfully" });
    } catch (error) {
        console.error('PUT /api/job-details error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objJobDetailsRouter.delete('/:detailId', async (req, res) => {
    try {
        const strDetailID = sanitizeString(req.params.detailId);

        if (!strDetailID) {
            return res.status(400).json({ outcome: "error", message: "Detail ID must be provided" });
        }

        const strQuery = "DELETE FROM job_details WHERE detail_id = ?";
        const objResult = await runAsync(strQuery, [strDetailID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Job detail not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Job detail deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/job-details/:detailId error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objJobDetailsRouter;
