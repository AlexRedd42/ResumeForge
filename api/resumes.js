const objExpress = require('express');
const objCrypto = require('crypto');
const { runAsync, allAsync } = require('../db/database');

const objResumesRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

objResumesRouter.get('/', async (req, res) => {
    try {
        const strQuery = `
            SELECT
                resume_id AS resumeId,
                name AS name,
                created_at AS createdAt
            FROM resumes
            ORDER BY created_at ASC
        `;

        const arrResumes = await allAsync(strQuery, []);
        return res.status(200).json(arrResumes);
    } catch (error) {
        console.error('GET /api/resumes error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumesRouter.post('/', async (req, res) => {
    try {
        const strResumeID = objCrypto.randomUUID();
        const strName = sanitizeString(req.body.name);
        const strCreatedAt = new Date().toISOString();

        if (!strName) {
            return res.status(400).json({ outcome: "error", message: "Resume name must be provided" });
        }

        const strQuery = "INSERT INTO resumes (resume_id, name, created_at) VALUES (?, ?, ?)";
        await runAsync(strQuery, [strResumeID, strName, strCreatedAt]);

        return res.status(201).json({ outcome: "success", message: "Resume created successfully", resumeId: strResumeID });
    } catch (error) {
        console.error('POST /api/resumes error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumesRouter.put('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.body.resumeId);
        const strName = sanitizeString(req.body.name);

        if (!strResumeID || !strName) {
            return res.status(400).json({ outcome: "error", message: "Resume ID and name must be provided" });
        }

        const strQuery = "UPDATE resumes SET name = ? WHERE resume_id = ?";
        const objResult = await runAsync(strQuery, [strName, strResumeID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Resume not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Resume updated successfully" });
    } catch (error) {
        console.error('PUT /api/resumes error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumesRouter.delete('/:resumeId', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.params.resumeId);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        const strQuery = "DELETE FROM resumes WHERE resume_id = ?";
        const objResult = await runAsync(strQuery, [strResumeID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Resume not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Resume deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/resumes/:resumeId error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objResumesRouter;
