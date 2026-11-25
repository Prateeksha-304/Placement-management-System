const companyService = require("../services/companyService");
const { successResponse } = require("../utils/apiResponse");

const companyController = {
    async getAll(req, res) {
        const companies = await companyService.getAllCompanies();
        // Return array directly for backward compatibility with existing tests, or successResponse
        if (req.query.format === "wrapped") {
            return successResponse(res, "Companies retrieved", companies, 200);
        }
        return res.status(200).json(companies);
    },

    async getById(req, res) {
        const company = await companyService.getCompanyById(req.params.id);
        return successResponse(res, "Company retrieved", company, 200);
    },

    async create(req, res) {
        const created = await companyService.createCompany(req.body);
        return successResponse(res, "Company created successfully", created, 201);
    },

    async update(req, res) {
        const updated = await companyService.updateCompany(req.params.id, req.body);
        return successResponse(res, "Company updated successfully", updated, 200);
    },

    async delete(req, res) {
        await companyService.deleteCompany(req.params.id);
        return successResponse(res, "Company deleted successfully", {}, 200);
    }
};

module.exports = companyController;
