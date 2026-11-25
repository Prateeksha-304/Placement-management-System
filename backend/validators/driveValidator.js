function validateDrive(req) {
    const errors = [];
    const { company_id, name, sal_lpa } = req.body || {};

    if (!company_id || typeof company_id !== "string" || !company_id.trim()) {
        errors.push("company_id is required.");
    }
    if (!name || typeof name !== "string" || !name.trim()) {
        errors.push("Drive name is required.");
    }
    if (sal_lpa !== undefined && (isNaN(Number(sal_lpa)) || Number(sal_lpa) < 0)) {
        errors.push("Salary package (sal_lpa) must be a non-negative number.");
    }

    return errors;
}

module.exports = {
    validateDrive
};
