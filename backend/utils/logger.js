function sanitize(data) {
    if (!data) return data;
    if (typeof data === "object") {
        const copy = Array.isArray(data) ? [...data] : { ...data };
        for (const key of Object.keys(copy)) {
            if (/password|secret|token|apikey|authorization/i.test(key)) {
                copy[key] = "[REDACTED]";
            } else if (typeof copy[key] === "object") {
                copy[key] = sanitize(copy[key]);
            }
        }
        return copy;
    }
    return data;
}

const logger = {
    info: (...args) => console.log(new Date().toISOString(), "[INFO]", ...args.map(sanitize)),
    warn: (...args) => console.warn(new Date().toISOString(), "[WARN]", ...args.map(sanitize)),
    error: (...args) => console.error(new Date().toISOString(), "[ERROR]", ...args.map(sanitize))
};

module.exports = logger;
