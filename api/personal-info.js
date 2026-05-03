const objExpress = require('express');
const { runAsync, getAsync } = require('../db/database');

const objPersonalInfoRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

function isValidEmail(strEmail) {
    if (!strEmail) {
        return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strEmail);
}

function isValidLinkedIn(strLinkedIn) {
    if (!strLinkedIn) {
        return true;
    }

    return strLinkedIn.startsWith('http://') || strLinkedIn.startsWith('https://') || strLinkedIn.startsWith('linkedin.com/');
}

objPersonalInfoRouter.get('/', async (req, res) => {
    try {
        const strQuery = `
            SELECT
                full_name AS fullName,
                email AS email,
                phone AS phone,
                linkedin AS linkedin,
                school_name AS schoolName,
                gpa AS gpa
            FROM personal_info
            WHERE id = 1
        `;

        const objPersonalInfo = await getAsync(strQuery, []);

        if (!objPersonalInfo) {
            return res.status(200).json({
                fullName: "",
                email: "",
                phone: "",
                linkedin: "",
                schoolName: "",
                gpa: ""
            });
        }

        return res.status(200).json(objPersonalInfo);
    } catch (error) {
        console.error('GET /api/personal-info error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

objPersonalInfoRouter.put('/', async (req, res) => {
    try {
        const strFullName = sanitizeString(req.body.fullName);
        const strEmail = sanitizeString(req.body.email);
        const strPhone = sanitizeString(req.body.phone);
        const strLinkedIn = sanitizeString(req.body.linkedin);
        const strSchoolName = sanitizeString(req.body.schoolName);
        const strGpa = sanitizeString(req.body.gpa);

        // All fields are optional for drafts, but every submitted value must be a string and valid when present.
        if (!isValidEmail(strEmail)) {
            return res.status(400).json({ outcome: "error", message: "Email must be a valid email address" });
        }

        if (!isValidLinkedIn(strLinkedIn)) {
            return res.status(400).json({ outcome: "error", message: "LinkedIn must be a valid URL or start with linkedin.com/" });
        }

        const strQuery = `
            INSERT INTO personal_info
                (id, full_name, email, phone, linkedin, school_name, gpa)
            VALUES
                (1, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                full_name = excluded.full_name,
                email = excluded.email,
                phone = excluded.phone,
                linkedin = excluded.linkedin,
                school_name = excluded.school_name,
                gpa = excluded.gpa
        `;

        await runAsync(strQuery, [strFullName, strEmail, strPhone, strLinkedIn, strSchoolName, strGpa]);

        return res.status(200).json({ outcome: "success", message: "Personal information saved successfully" });
    } catch (error) {
        console.error('PUT /api/personal-info error:', error);
        return res.status(500).json({ outcome: "error", message: "Internal server error" });
    }
});

module.exports = objPersonalInfoRouter;
