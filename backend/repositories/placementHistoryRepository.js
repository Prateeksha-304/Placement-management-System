const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

const VERIFIED_PACKAGES_FILE = path.join(__dirname, "../data/verified_placement_packages.json");

function loadVerifiedPackages() {
    try {
        if (fs.existsSync(VERIFIED_PACKAGES_FILE)) {
            const raw = fs.readFileSync(VERIFIED_PACKAGES_FILE, "utf-8");
            return JSON.parse(raw);
        }
    } catch {}
    return {};
}

function saveVerifiedPackages(data) {
    try {
        const dir = path.dirname(VERIFIED_PACKAGES_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(VERIFIED_PACKAGES_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.warn("[PlacementHistory] Could not persist verified packages file:", err.message);
    }
}

let verifiedPackagesCache = loadVerifiedPackages();

function mergePackageLpa(record) {
    if (!record) return record;
    const placId = record.plac_id;
    let pkg = record.package_lpa;
    if (pkg === undefined || pkg === null) {
        pkg = verifiedPackagesCache[placId] !== undefined ? verifiedPackagesCache[placId] : null;
    }
    return {
        ...record,
        package_lpa: pkg !== null && pkg !== undefined && !isNaN(Number(pkg)) ? Number(Number(pkg).toFixed(2)) : null
    };
}

const placementHistoryRepository = {
    async getAll() {
        const response = await supabase.get("/placement_history", {
            params: {
                select: "*",
                order: "plac_id.desc"
            }
        });
        const rows = response.data || [];
        return rows.map(mergePackageLpa);
    },

    async findById(placId) {
        const response = await supabase.get("/placement_history", {
            params: {
                select: "*",
                plac_id: `eq.${placId}`
            }
        });
        const row = response.data?.[0] || null;
        return mergePackageLpa(row);
    },

    async findByUsn(usn) {
        const response = await supabase.get("/placement_history", {
            params: {
                select: "*",
                usn: `ilike.${usn}`
            }
        });
        const rows = response.data || [];
        return rows.map(mergePackageLpa);
    },

    async findByUsnAndCompany(usn, companyId) {
        const response = await supabase.get("/placement_history", {
            params: {
                select: "*",
                usn: `ilike.${usn}`,
                company_id: `eq.${companyId}`
            }
        });
        const row = response.data?.[0] || null;
        return mergePackageLpa(row);
    },

    async create(data) {
        const payload = { ...data };
        const desiredPackage = payload.package_lpa !== undefined && payload.package_lpa !== null && !isNaN(Number(payload.package_lpa))
            ? Number(Number(payload.package_lpa).toFixed(2))
            : null;

        try {
            const response = await supabase.post("/placement_history", payload, {
                headers: {
                    Prefer: "return=representation"
                }
            });
            const created = response.data?.[0] || null;
            if (created && desiredPackage !== null) {
                verifiedPackagesCache[created.plac_id] = desiredPackage;
                saveVerifiedPackages(verifiedPackagesCache);
            }
            return mergePackageLpa(created);
        } catch (err) {
            // If package_lpa column is not yet in Supabase schema cache, retry without package_lpa and store in cache
            if (err.response?.data?.code === "PGRST204" && err.response?.data?.message?.includes("package_lpa")) {
                console.warn("[PlacementHistory] package_lpa column not in Supabase schema cache. Saving base record and caching package_lpa.");
                delete payload.package_lpa;
                const retryResponse = await supabase.post("/placement_history", payload, {
                    headers: {
                        Prefer: "return=representation"
                    }
                });
                const created = retryResponse.data?.[0] || null;
                if (created && desiredPackage !== null) {
                    verifiedPackagesCache[created.plac_id] = desiredPackage;
                    saveVerifiedPackages(verifiedPackagesCache);
                }
                return mergePackageLpa(created);
            }
            throw err;
        }
    },

    async update(placId, updates) {
        const payload = { ...updates };
        const desiredPackage = payload.package_lpa !== undefined && payload.package_lpa !== null && !isNaN(Number(payload.package_lpa))
            ? Number(Number(payload.package_lpa).toFixed(2))
            : (payload.package_lpa === null ? null : undefined);

        try {
            const response = await supabase.patch("/placement_history", payload, {
                params: {
                    plac_id: `eq.${placId}`
                },
                headers: {
                    Prefer: "return=representation"
                }
            });
            const updated = response.data?.[0] || await this.findById(placId);
            if (desiredPackage !== undefined) {
                if (desiredPackage === null) {
                    delete verifiedPackagesCache[placId];
                } else {
                    verifiedPackagesCache[placId] = desiredPackage;
                }
                saveVerifiedPackages(verifiedPackagesCache);
            }
            return mergePackageLpa(updated);
        } catch (err) {
            if (err.response?.data?.code === "PGRST204" && err.response?.data?.message?.includes("package_lpa")) {
                console.warn("[PlacementHistory] package_lpa column not in Supabase schema cache. Caching package_lpa update.");
                delete payload.package_lpa;
                let updated = null;
                if (Object.keys(payload).length > 0) {
                    const retryResponse = await supabase.patch("/placement_history", payload, {
                        params: {
                            plac_id: `eq.${placId}`
                        },
                        headers: {
                            Prefer: "return=representation"
                        }
                    });
                    updated = retryResponse.data?.[0];
                } else {
                    updated = await this.findById(placId);
                }
                if (desiredPackage !== undefined) {
                    if (desiredPackage === null) {
                        delete verifiedPackagesCache[placId];
                    } else {
                        verifiedPackagesCache[placId] = desiredPackage;
                    }
                    saveVerifiedPackages(verifiedPackagesCache);
                }
                return mergePackageLpa(updated);
            }
            throw err;
        }
    },

    async updatePackageLpa(placId, packageLpa) {
        return await this.update(placId, { package_lpa: packageLpa });
    },

    async delete(placId) {
        const response = await supabase.delete("/placement_history", {
            params: {
                plac_id: `eq.${placId}`
            }
        });
        delete verifiedPackagesCache[placId];
        saveVerifiedPackages(verifiedPackagesCache);
        return response.status === 204 || response.status === 200;
    },

    async deleteByUsnAndCompany(usn, companyId) {
        const existing = await this.findByUsnAndCompany(usn, companyId);
        const response = await supabase.delete("/placement_history", {
            params: {
                usn: `eq.${usn}`,
                company_id: `eq.${companyId}`
            }
        });
        if (existing?.plac_id) {
            delete verifiedPackagesCache[existing.plac_id];
            saveVerifiedPackages(verifiedPackagesCache);
        }
        return response.status === 204 || response.status === 200;
    },

    async getNextPlacId() {
        const all = await this.getAll();
        const nums = all
            .map(h => {
                const match = String(h.plac_id).match(/(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));
        const nextNum = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
        return `PLH-${String(nextNum).padStart(6, "0")}`;
    }
};

module.exports = placementHistoryRepository;
