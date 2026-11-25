const ROLES = {
    STUDENT: "student",
    OFFICER: "placement_officer",
    COORDINATOR: "placement_coordinator"
};

// Frontend role aliases for seamless compatibility
const FRONTEND_ROLE_MAP = {
    student: ROLES.STUDENT,
    officer: ROLES.OFFICER,
    placement_officer: ROLES.OFFICER,
    coordinator: ROLES.COORDINATOR,
    placement_coordinator: ROLES.COORDINATOR
};

const APPLICATION_STATUS = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    SELECTED: "Selected",
    REJECTED: "Rejected"
};

const READ_STATUS = {
    READ: "Read",
    UNREAD: "Unread"
};

module.exports = {
    ROLES,
    FRONTEND_ROLE_MAP,
    APPLICATION_STATUS,
    READ_STATUS
};
