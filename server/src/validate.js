const languages = require('./languages');

function validateRequest(body) {
    const { code, language = 'javascript' } = body;

    if (!code || typeof code !== 'string') {
        return 'code must be a non-empty string';
    }
    if (code.length > 10000) {
        return 'code exceeds 10,000 character limit';
    }
    if (!languages[language]) {
        return `unsupported language: ${language}. Supported: ${Object.keys(languages).join(', ')}`;
    }

    return null; // null = valid
}

module.exports = { validateRequest };