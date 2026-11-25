function validateCompany(req) {
    const errors = [];
    const { name } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
        errors.push("Company name is required.");
    }

    return errors;
}

module.exports = {
    validateCompany
};
