"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResultSettings = exports.getResultSettings = exports.deleteTax = exports.changeTaxStatus = exports.updateTax = exports.getTax = exports.addTax = exports.getRegistrationSettings = exports.updateRegistrationFields = exports.updateEmailPreference = exports.updateGeneralEmailSettings = exports.getGeneralEmailSettings = exports.getEmailPreference = exports.getSmsSettings = exports.updateSmsSettings = exports.updateApplicationSettings = exports.getApplicationSettingsBilling = exports.getApplicationSettings = void 0;
const helper_1 = require("../../../helper");
const appset_1 = __importDefault(require("./../../models/application/appsettings/appset"));
const Tax_1 = __importDefault(require("../../models/application/Tax"));
const resultSettings_1 = __importDefault(require("../../models/application/appsettings/resultSettings"));
const logger_1 = __importDefault(require("../../../logger"));
const appsettings = new appset_1.default();
const tax = new Tax_1.default(null);
const result = new resultSettings_1.default(null);
const getApplicationSettings = async (req, response) => {
    try {
        const result = await appsettings.getAllAppSettings();
        response.send({ statusCode: 200, status: "success", result });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getApplicationSettings = getApplicationSettings;
const getApplicationSettingsBilling = async (req, res) => {
    try {
        const data = await appsettings.getAppBillSettings();
        res.send(data);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getApplicationSettingsBilling = getApplicationSettingsBilling;
const updateApplicationSettings = async (request, response) => {
    try {
        const data = request.body;
        const is_updated = await appsettings.updateApplicationSettings(data);
        is_updated && response.send({ message: "Applications settings updated successfully", statusCode: 200, status: "success" });
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(response);
    }
};
exports.updateApplicationSettings = updateApplicationSettings;
const updateSmsSettings = async (req, res) => {
    try {
        const data = req.body;
        const is_updated = await appsettings.updateSmsSettings(data);
        res.send({ status: is_updated });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.updateSmsSettings = updateSmsSettings;
const getSmsSettings = async (request, response) => {
    try {
        const sms_settings = await appsettings.getSmsSettings();
        response.send(sms_settings);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getSmsSettings = getSmsSettings;
const getEmailPreference = async (req, res) => {
    try {
        const result = await appsettings.getEmailPreference();
        res.send({ message: "success", status: "success", statusCode: 200, result });
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, res);
    }
};
exports.getEmailPreference = getEmailPreference;
const getGeneralEmailSettings = async (req, response) => {
    try {
        const result = await appsettings.getGeneralEmailSettings();
        response.send({ message: "success", status: "success", statusCode: 200, result });
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, response);
    }
};
exports.getGeneralEmailSettings = getGeneralEmailSettings;
const updateGeneralEmailSettings = async (request, res) => {
    try {
        const result = await appsettings.updateGeneralEmailSettings(request.body);
        res.send({
            message: (0, helper_1.rowAffected)(result) ? "updated successfully" : "No updates effected",
            status: "success",
            statusCode: 200,
        });
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, res);
    }
};
exports.updateGeneralEmailSettings = updateGeneralEmailSettings;
const updateEmailPreference = (request, response) => {
    try {
        const data = request.body;
        const updated = appsettings.updateEmailPreference(data);
        response.send(updated);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.updateEmailPreference = updateEmailPreference;
const updateRegistrationFields = async (request, response) => {
    try {
        const result = await appsettings.updateRegistrationFields(request.body);
        if (result === true) {
            response.send({ message: "fields updated successfully", statusCode: 200, status: "success" });
        }
        else {
            response.send({ message: "fields update failed", statusCode: "error", status: "error" });
        }
    }
    catch (err) {
        logger_1.default.error(err);
        (0, helper_1.responseError)(response);
    }
};
exports.updateRegistrationFields = updateRegistrationFields;
const getRegistrationSettings = async (req, res) => {
    try {
        let result = await appsettings.getRegistrationSettings();
        if (result.length > 0) {
            result = result[0]["fields"];
            if (result !== "{}") {
                return res.send(result);
            }
            res.send(result);
        }
        else {
            return res.send({});
        }
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getRegistrationSettings = getRegistrationSettings;
const addTax = (req, res) => {
    tax.addTax(req, res);
};
exports.addTax = addTax;
const getTax = (req, res) => {
    tax.getTax(req, res);
};
exports.getTax = getTax;
const updateTax = (req, res) => {
    tax.updateTax(req, res);
};
exports.updateTax = updateTax;
const changeTaxStatus = (req, res) => {
    tax.changeTaxStatus(req, res);
};
exports.changeTaxStatus = changeTaxStatus;
const deleteTax = (req, res) => {
    tax.deleteTax(req, res);
};
exports.deleteTax = deleteTax;
const getResultSettings = (req, res) => {
    result.getResultSettings(req, res);
};
exports.getResultSettings = getResultSettings;
const updateResultSettings = (req, res) => {
    result.updateResultSettings(req, res);
};
exports.updateResultSettings = updateResultSettings;
