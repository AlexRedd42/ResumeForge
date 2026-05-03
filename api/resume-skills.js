const objExpress = require('express');
const { runAsync, allAsync } = require('../db/database');

const objResumeSkillsRouter = objExpress.Router();

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

objResumeSkillsRouter.get('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.query.resumeId);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        const strQuery = "SELECT resume_id AS resumeId, skill_id AS skillId FROM resume_skills WHERE resume_id = ?";
        const arrResumeSkills = await allAsync(strQuery, [strResumeID]);

        return res.status(200).json(arrResumeSkills);
    } catch (error) {
        console.error('GET /api/resume-skills error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objResumeSkillsRouter.put('/', async (req, res) => {
    try {
        const strResumeID = sanitizeString(req.body.resumeId);
        const arrSkillIDs = sanitizeArray(req.body.skillIds);

        if (!strResumeID) {
            return res.status(400).json({ outcome: "error", message: "Resume ID must be provided" });
        }

        await runAsync("DELETE FROM resume_skills WHERE resume_id = ?", [strResumeID]);

        for (const strSkillID of arrSkillIDs) {
            await runAsync("INSERT OR IGNORE INTO resume_skills (resume_id, skill_id) VALUES (?, ?)", [strResumeID, strSkillID]);
        }

        return res.status(200).json({ outcome: "success", message: "Resume skills updated successfully" });
    } catch (error) {
        console.error('PUT /api/resume-skills error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objResumeSkillsRouter;
