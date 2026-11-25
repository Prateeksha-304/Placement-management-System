const jwt = require("jsonwebtoken");
const env = require("./environment");

/**
 * Sign an application JWT token
 * @param {Object} payload { sub, email, role, usn }
 * @returns {string} JWT token
 */
function signToken(payload) {
    const options = {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {Object} decoded token payload
 */
function verifyToken(token) {
    const options = {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    };

    return jwt.verify(token, env.JWT_SECRET, options);
}

module.exports = {
    signToken,
    verifyToken
};
