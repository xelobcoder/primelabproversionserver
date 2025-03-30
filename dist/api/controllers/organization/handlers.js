"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationPricingHandler = exports.createOrganizationPricingHandler = exports.generateMonthlySalesReport = exports.getTopPerformance = exports.getOrganizationId = exports.getOrganizationCommissionByMonth = exports.dailyOrganizationCommission = exports.upload = exports.updateOrganizationPayment = exports.updateOrganizationContact = exports.updateOrganizationBasic = exports.createAOrganization = exports.getOrganizationImage = exports.uploadOrganizationProfilePicture = exports.getOrganizationWithDetails = exports.deleteOrganization = exports.getOrganizationsPayment = exports.getOrganizationsContact = exports.getOrganizationsBasic = exports.getOrganizations = void 0;
const organization_1 = __importDefault(require("../../models/organization/organization"));
const helper_1 = require("../../../helper");
const uploadImages_1 = require("./uploadImages");
const organizationBilling_1 = __importDefault(require("../../models/organization/organizationBilling"));
const getOrganizations = async (req, res) => {
    try {
        const organizations = await new organization_1.default(null).getOrganizations();
        res.status(200).json({ organizations });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getOrganizations = getOrganizations;
const getOrganizationsBasic = async (request, response) => {
    try {
        const { id } = request.query;
        if (!id)
            return (0, helper_1.customError)(`organizationid required`, 404, response);
        const organizationalId = parseInt(id);
        const result = await new organization_1.default(organizationalId).getOrganizationBasic();
        response.send({ statusCode: 200, status: "success", result });
    }
    catch (error) {
        (0, helper_1.responseError)(response, "Error occured getting organization info");
    }
};
exports.getOrganizationsBasic = getOrganizationsBasic;
const getOrganizationsContact = async (req, res) => {
    try {
        const organizationsContact = await new organization_1.default(parseInt(req.query.id.toString())).getOrganizationContact();
        res.send(organizationsContact);
    }
    catch (error) {
        console.error("Error in getOrganizationsContact:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getOrganizationsContact = getOrganizationsContact;
const getOrganizationsPayment = async (request, response) => {
    try {
        const organizationid = request.query.id;
        if (!organizationid)
            return (0, helper_1.customError)('Invalid request query param provided, organizationid missing', 400, response);
        const org_id = parseInt(organizationid.toString());
        const packets = await new organization_1.default(org_id).getOrganizationalPayment();
        response.send(packets);
    }
    catch (error) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationsPayment = getOrganizationsPayment;
const deleteOrganization = async (request, response) => {
    try {
        const { organizationid, employeeid, isPasswordConfirmed } = request.query;
        const deletionStatus = await new organization_1.default(parseInt(organizationid.toString())).deleteOrganization(parseInt(employeeid.toString()), isPasswordConfirmed);
        response.send({ status: deletionStatus });
    }
    catch (error) {
        console.error("Error in deleteOrganization:", error);
        (0, helper_1.responseError)(response);
    }
};
exports.deleteOrganization = deleteOrganization;
const getOrganizationWithDetails = async (request, response) => {
    try {
        const organizationDetails = await new organization_1.default(null).getOrganizationWithDetails(request.query);
        response.send({ statusCode: 200, result: organizationDetails, status: "success" });
    }
    catch (error) {
        response.send({ error: "Internal server error" });
    }
};
exports.getOrganizationWithDetails = getOrganizationWithDetails;
const uploadOrganizationProfilePicture = async (request, response) => {
    try {
    }
    catch (err) {
        console.log(err);
    }
};
exports.uploadOrganizationProfilePicture = uploadOrganizationProfilePicture;
const getOrganizationImage = async (request, response) => {
    try {
        const { id } = request.query;
        const filename = await (0, uploadImages_1.getUploadedImages)('organizations', id.toString());
        if (filename) {
            response.sendFile(filename);
        }
    }
    catch (err) {
        console.log(err);
    }
};
exports.getOrganizationImage = getOrganizationImage;
const createAOrganization = async (request, response) => {
    try {
        const isCreatedSuccess = await new organization_1.default(null).createAorganization(request.body);
        if (isCreatedSuccess === "organization with such name exist" /* OperationsStatus.exist */) {
            return response.send({ message: "organization with such name exist" /* OperationsStatus.exist */, status: 'exist' });
        }
        response.send({ message: isCreatedSuccess === true ? "Organization created successfully" : "creating a new organization failed", status: 'created' });
    }
    catch (error) {
        response.status(500).json({ error: "Internal server error" });
    }
};
exports.createAOrganization = createAOrganization;
const updateOrganizationBasic = async (request, response) => {
    try {
        const isUpdated = await new organization_1.default(null).updateOrganizationBasic(request.body);
        response.status(200).json({ message: isUpdated ? "Organization basic information updated successfully" : "resource update failed" });
    }
    catch (error) {
        response.status(500).json({ error: "Internal server error" });
    }
};
exports.updateOrganizationBasic = updateOrganizationBasic;
const updateOrganizationContact = async (request, response) => {
    try {
        const { organizationid } = request.body;
        if (!organizationid)
            return (0, helper_1.customError)('Invalid request body provided', 400, response);
        const isResourcesUpdated = await new organization_1.default(organizationid).updateOrganizationalContactInfo(request.body);
        response.send({ status: isResourcesUpdated, message: isResourcesUpdated ? "Organization contact information updated successfully" : "Organization contact information update failed" });
    }
    catch (error) {
        response.status(500).json({ error: "Internal server error" });
    }
};
exports.updateOrganizationContact = updateOrganizationContact;
const updateOrganizationPayment = async (request, response) => {
    try {
        const { id } = request.body;
        const is_field_updated = await new organization_1.default(id).updateOrganizationPayment(request.body);
        response.send({ status: is_field_updated });
    }
    catch (error) {
        response.status(500).json({ error: "Internal server error" });
    }
};
exports.updateOrganizationPayment = updateOrganizationPayment;
const upload = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No file uploaded" });
        }
        else {
            res.status(200).json({ message: "File uploaded successfully" });
        }
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.upload = upload;
const dailyOrganizationCommission = async (request, response) => {
    try {
        const { organizationid } = request.query;
        if (!organizationid)
            return (0, helper_1.customError)('organizationid not provided', 400, response);
        let id = parseInt(organizationid.toString());
        const commission = await new organization_1.default(id).daySales();
        response.send({ commission });
    }
    catch (error) {
        (0, helper_1.responseError)(response);
    }
};
exports.dailyOrganizationCommission = dailyOrganizationCommission;
const getOrganizationCommissionByMonth = async (request, response) => {
    try {
        const { organizationid } = request.query;
        if (!organizationid)
            return (0, helper_1.customError)('organizationid not provided', 400, response);
        let id = parseInt(organizationid.toString());
        const commissionByMonth = await new organization_1.default(id).monthSales();
        response.send({ commissionByMonth });
    }
    catch (error) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationCommissionByMonth = getOrganizationCommissionByMonth;
const getOrganizationId = async (req, res) => {
    try {
        const organizationId = await organization_1.default.getOrganizationId(req, res);
        res.status(200).json({ organizationId });
    }
    catch (error) {
        console.error("Error in getOrganizationId:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getOrganizationId = getOrganizationId;
const getTopPerformance = async (request, response) => {
    try {
        const topPerformers = await new organization_1.default(null).getTopPerformance(request.query);
        response.send({ topPerformers });
    }
    catch (error) {
        (0, helper_1.responseError)(response);
    }
};
exports.getTopPerformance = getTopPerformance;
const generateMonthlySalesReport = async (req, res) => {
    try {
        let { organizationid } = req.query;
        if (!organizationid)
            return (0, helper_1.customError)("Organization id required", 404, res);
        const orgid = parseInt(organizationid.toString());
        const report = await new organization_1.default(orgid).generateOrganizationalSalesReport();
        res.status(200).json({ status: "success", statusCode: 200, result: report });
    }
    catch (error) {
        console.error("Error in generateMonthlySalesReport:", error);
        (0, helper_1.customError)("Something went wrong", 500, res);
    }
};
exports.generateMonthlySalesReport = generateMonthlySalesReport;
const createOrganizationPricingHandler = async (request, response) => {
    try {
        const responseBody = request.body;
        const result = await new organizationBilling_1.default(responseBody.organizationid).createOrganizationalPricing(responseBody);
        response.send({ status: result });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.createOrganizationPricingHandler = createOrganizationPricingHandler;
const getOrganizationPricingHandler = async (request, response) => {
    try {
        const organizationid = request.query.organizationid;
        if (!organizationid)
            return (0, helper_1.customError)("organizational id missing in query", 400, response);
        const result = await new organizationBilling_1.default(parseInt(organizationid.toString())).getOrganizationalBilling();
        response.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationPricingHandler = getOrganizationPricingHandler;
