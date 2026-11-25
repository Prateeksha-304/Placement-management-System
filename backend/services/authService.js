const axios = require("axios");
const env = require("../config/environment");
const { signToken } = require("../config/jwt");
const userRepository = require("../repositories/userRepository");
const studentRepository = require("../repositories/studentRepository");
const { FRONTEND_ROLE_MAP } = require("../utils/statusConstants");

const authService = {
    /**
     * Authenticate user via Supabase Auth & user_roles
     */
    async login(email, password, requestedRole) {
        if (!email || !password) {
            const err = new Error("Email and password are required.");
            err.statusCode = 400;
            throw err;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Verify credentials with Supabase Auth
        let authIdentity = null;
        try {
            const authResponse = await axios.post(
                `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
                {
                    email: normalizedEmail,
                    password
                },
                {
                    headers: {
                        apikey: env.SUPABASE_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                }
            );
            authIdentity = authResponse.data?.user;
        } catch (authErr) {
            // Check if user exists in user_roles
            const userRole = await userRepository.findByEmail(normalizedEmail);
            if (!userRole) {
                const err = new Error("Invalid email or password.");
                err.statusCode = 401;
                throw err;
            }

            if (!userRole.is_active) {
                const err = new Error("Account has been deactivated. Please contact the placement cell.");
                err.statusCode = 403;
                throw err;
            }

            // Check if user is already provisioned in auth.users
            try {
                const adminCheck = await axios.get(
                    `${env.SUPABASE_URL}/auth/v1/admin/users`,
                    {
                        headers: {
                            apikey: env.SUPABASE_KEY,
                            Authorization: `Bearer ${env.SUPABASE_KEY}`
                        }
                    }
                );
                const existingAuthUser = adminCheck.data?.users?.find(
                    u => u.email?.toLowerCase() === normalizedEmail
                );

                if (!existingAuthUser) {
                    // Provision user in Supabase Auth with their matching user_id
                    const createRes = await axios.post(
                        `${env.SUPABASE_URL}/auth/v1/admin/users`,
                        {
                            id: userRole.user_id,
                            email: normalizedEmail,
                            password: password,
                            email_confirm: true
                        },
                        {
                            headers: {
                                apikey: env.SUPABASE_KEY,
                                Authorization: `Bearer ${env.SUPABASE_KEY}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                    authIdentity = createRes.data?.user || createRes.data;
                } else {
                    const err = new Error("Invalid email or password.");
                    err.statusCode = 401;
                    throw err;
                }
            } catch (provisionErr) {
                if (provisionErr.statusCode) throw provisionErr;
                const err = new Error("Invalid email or password.");
                err.statusCode = 401;
                throw err;
            }
        }

        // 2. Lookup role from user_roles
        const userRole = await userRepository.findByEmail(normalizedEmail);

        if (!userRole) {
            const err = new Error("Access denied. No university placement role is assigned to this account.");
            err.statusCode = 403;
            throw err;
        }

        // 3. Check if account is active
        if (!userRole.is_active) {
            const err = new Error("Account has been deactivated. Please contact the placement cell.");
            err.statusCode = 403;
            throw err;
        }

        // 4. Role authorization check if requested
        if (requestedRole) {
            const expectedRole = FRONTEND_ROLE_MAP[requestedRole] || requestedRole;
            if (userRole.role !== expectedRole) {
                const err = new Error(`Account is not authorized for the role '${requestedRole}'.`);
                err.statusCode = 403;
                throw err;
            }
        }

        // 5. Gather profile info (student name if student)
        let profileName = "";
        if (userRole.role === "student" && userRole.usn) {
            const student = await studentRepository.findByUsn(userRole.usn);
            if (student) {
                profileName = [student.fname, student.mname, student.lname].filter(Boolean).join(" ");
            }
        } else if (userRole.role === "placement_officer") {
            profileName = "Placement Officer";
        } else if (userRole.role === "placement_coordinator") {
            profileName = "Placement Coordinator";
        }

        // 6. Sign Application JWT
        const tokenPayload = {
            sub: authIdentity?.id || userRole.user_id,
            email: userRole.email,
            role: userRole.role,
            usn: userRole.usn || null
        };

        const token = signToken(tokenPayload);

        return {
            token,
            user: {
                id: userRole.user_id,
                email: userRole.email,
                role: userRole.role,
                usn: userRole.usn || null,
                name: profileName || userRole.email.split("@")[0]
            }
        };
    },

    /**
     * Get authenticated user profile from verified token
     */
    async getMe(userClaims) {
        const userRole = await userRepository.findByEmail(userClaims.email);

        if (!userRole || !userRole.is_active) {
            const err = new Error("Account not found or has been deactivated.");
            err.statusCode = 403;
            throw err;
        }

        let student = null;
        if (userRole.role === "student" && userRole.usn) {
            student = await studentRepository.findByUsn(userRole.usn);
        }

        return {
            id: userRole.user_id,
            email: userRole.email,
            role: userRole.role,
            usn: userRole.usn,
            studentDetails: student || null
        };
    }
};

module.exports = authService;
