function validateLogin(req) {
    const errors = [];
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
        errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push("Invalid email format.");
    }

    if (!password || typeof password !== "string" || !password.trim()) {
        errors.push("Password is required.");
    }

    return errors;
}

module.exports = {
    validateLogin
};
