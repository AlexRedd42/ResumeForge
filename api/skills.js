const objExpress = require('express');
const objCrypto = require('crypto');
const { runAsync, allAsync } = require('../db/database');

const objSkillsRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

objSkillsRouter.get('/', async (req, res) => {
    try {
        const strQuery = `
            SELECT
                skill_id AS skillId,
                category AS category,
                name AS name
            FROM skills
            ORDER BY category ASC, name ASC
        `;

        const arrSkills = await allAsync(strQuery, []);
        return res.status(200).json(arrSkills);
    } catch (error) {
        console.error('GET /api/skills error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objSkillsRouter.post('/', async (req, res) => {
    try {
        const strSkillID = objCrypto.randomUUID();
        const strCategory = sanitizeString(req.body.category);
        const strName = sanitizeString(req.body.name);

        if (!strCategory || !strName) {
            return res.status(400).json({ outcome: "error", message: "Skill category and name must be provided" });
        }

        const strQuery = `
            INSERT INTO skills
                (skill_id, category, name)
            VALUES
                (?, ?, ?)
        `;

        await runAsync(strQuery, [strSkillID, strCategory, strName]);

        return res.status(201).json({ outcome: "success", message: "Skill created successfully", skillId: strSkillID });
    } catch (error) {
        console.error('POST /api/skills error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objSkillsRouter.put('/', async (req, res) => {
    try {
        const strSkillID = sanitizeString(req.body.skillId);
        const strCategory = sanitizeString(req.body.category);
        const strName = sanitizeString(req.body.name);

        if (!strSkillID || !strCategory || !strName) {
            return res.status(400).json({ outcome: "error", message: "Skill ID, category, and name must be provided" });
        }

        const strQuery = `
            UPDATE skills
            SET category = ?,
                name = ?
            WHERE skill_id = ?
        `;

        const objResult = await runAsync(strQuery, [strCategory, strName, strSkillID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Skill not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Skill updated successfully" });
    } catch (error) {
        console.error('PUT /api/skills error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objSkillsRouter.delete('/:skillId', async (req, res) => {
    try {
        const strSkillID = sanitizeString(req.params.skillId);

        if (!strSkillID) {
            return res.status(400).json({ outcome: "error", message: "Skill ID must be provided" });
        }

        const strQuery = "DELETE FROM skills WHERE skill_id = ?";
        const objResult = await runAsync(strQuery, [strSkillID]);

        if (objResult.intChanges === 0) {
            return res.status(404).json({ outcome: "error", message: "Skill not found" });
        }

        return res.status(200).json({ outcome: "success", message: "Skill deleted successfully" });
    } catch (error) {
        console.error('DELETE /api/skills/:skillId error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objSkillsRouter;
