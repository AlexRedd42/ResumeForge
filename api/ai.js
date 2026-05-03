const objExpress = require('express');
const { GoogleGenAI } = require('@google/genai');

const objAiRouter = objExpress.Router();

function sanitizeString(strValue) {
    if (typeof strValue !== 'string') {
        return '';
    }

    return strValue.trim();
}

function getPlainTextFromHtml(strContent) {
    return strContent.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(strValue) {
    return strValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatImprovedContentAsHtml(strImprovedContent) {
    const strCleanContent = sanitizeString(strImprovedContent).replace(/^[-*]\s*/, '');
    return `<p>${escapeHtml(strCleanContent)}</p>`;
}

objAiRouter.post('/improve-detail', async (req, res) => {
    try {
        const strContent = sanitizeString(req.body.content);
        const strPlainContent = getPlainTextFromHtml(strContent);
        const strApiKey = process.env.GEMINI_API_KEY;

        // The frontend sends Quill HTML, but validation uses the readable text so empty tags are rejected.
        if (!strPlainContent) {
            return res.status(400).json({ outcome: "error", message: "Content must be provided" });
        }

        if (!strApiKey) {
            return res.status(500).json({ outcome: "error", message: "Gemini API key is not configured" });
        }

        const objGeminiClient = new GoogleGenAI({ apiKey: strApiKey });
        const strPrompt = `Improve the following resume bullet point to be more professional, concise, and impactful. Use action verbs and quantify impact where possible. Return only one improved bullet point as plain text, without explanations or markdown:\n\n${strPlainContent}`;

        const objGeminiResponse = await objGeminiClient.models.generateContent({
            model: 'gemini-2.5-flash', // This is the model that my API key is able to access. I assume all free tier API keys are the same, but if they aren't, change this line to be the model you can access.
            contents: strPrompt
        });

        const strImprovedText = sanitizeString(objGeminiResponse.text);

        if (!strImprovedText) {
            return res.status(500).json({ outcome: "error", message: "Gemini did not return an improvement" });
        }

        return res.status(200).json({
            improvedContent: formatImprovedContentAsHtml(strImprovedText)
        });
    } catch (error) {
        console.error('POST /api/ai/improve-detail error:', error);
        return res.status(500).json({ outcome: "error", message: "Unable to improve content right now" });
    }
    console.log(objGeminiResponse);
});

module.exports = objAiRouter;
