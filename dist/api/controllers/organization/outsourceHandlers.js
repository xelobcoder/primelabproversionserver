"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationOutsourcingAll = exports.getOrganizationOutSourceBasic = exports.getOrganizationOutSourceServices = exports.updateOrganizationOutSourceServices = exports.updateOrganizationOutSource = exports.createOrganizationOutSource = void 0;
const helper_1 = require("../../../helper");
const outsourcing_1 = __importDefault(require("../../models/organization/outsourcingOrganization/outsourcing"));
const createOrganizationOutSource = async function (request, response) {
    try {
        const { contactNumber, name } = request.body;
        if (!contactNumber || !name || isNaN(contactNumber)) {
            return (0, helper_1.customError)('Invalid request provided', 400, response);
        }
        const isCreated = await new outsourcing_1.default(name, contactNumber).createOutSourceOrganization(request.body);
        response.send({ status: isCreated });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.createOrganizationOutSource = createOrganizationOutSource;
const updateOrganizationOutSource = async function (request, response) {
    try {
        const { outsourceid } = request.body;
        if (!outsourceid) {
            return (0, helper_1.customError)('Invalid outsourceid request provided', 400, response);
        }
        const isUpdated = await new outsourcing_1.default(null, null).updateOutsourceOrganization(request.body);
        response.send({ status: isUpdated });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.updateOrganizationOutSource = updateOrganizationOutSource;
const updateOrganizationOutSourceServices = async function (request, response) {
    try {
        const { outsourceid } = request.body;
        if (!outsourceid) {
            return (0, helper_1.customError)('Invalid outsourceid request provided', 400, response);
        }
        const isUpdated = await new outsourcing_1.default(null, null).loadoutsourceOrganizationServices(request.body);
        response.send({ status: isUpdated });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.updateOrganizationOutSourceServices = updateOrganizationOutSourceServices;
const getOrganizationOutSourceServices = async function (request, response) {
    try {
        const { outsourceid } = request.query;
        if (!outsourceid) {
            return (0, helper_1.customError)('Invalid outsourceid request provided', 400, response);
        }
        const data = await new outsourcing_1.default(null, null).getOrganizationOursourcePricing(parseInt(outsourceid.toString()));
        response.send(data);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationOutSourceServices = getOrganizationOutSourceServices;
const getOrganizationOutSourceBasic = async function (request, response) {
    try {
        const { outsourceid } = request.query;
        if (!outsourceid) {
            return (0, helper_1.customError)('Invalid outsourceid request provided', 400, response);
        }
        const data = await new outsourcing_1.default(null, null).getOrganizationBasicInformation(parseInt(outsourceid.toString()));
        response.send(data);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationOutSourceBasic = getOrganizationOutSourceBasic;
const getOrganizationOutsourcingAll = async function (request, response) {
    try {
        const data = await new outsourcing_1.default(null, null).getAllOutsourcingOrganization(request.query);
        response.send(data);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getOrganizationOutsourcingAll = getOrganizationOutsourcingAll;
