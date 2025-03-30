"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationSettings = exports.getEmergencyContactInformation = exports.getAddressingInformation = exports.checkMobileNumber = exports.getPersonalInformation = exports.updateAddressingInformation = exports.updateEmergencyContactInformation = exports.updatePersonalInformation = exports.addNewPatient = void 0;
const helper_1 = require("../../helper");
const queries_1 = __importDefault(require("../database/queries"));
const registration_1 = __importDefault(require("../models/registration"));
const EmailCore_1 = __importDefault(require("../EmailServices/EmailCore"));
const emailService = new EmailCore_1.default();
const addNewPatient = async (req, res) => {
    try {
        const register = new registration_1.default();
        const outcome = await register.addNewPatient(req, res);
        if (typeof outcome === "number") {
            res.send({
                statusCode: 200,
                status: "success",
                message: "Patient registered successfully",
                patientid: outcome,
            });
            await emailService.fireClientAuthentication(outcome);
        }
    }
    catch (error) {
        console.error(error);
        (0, helper_1.customError)("Error registering patient", 500, res);
    }
};
exports.addNewPatient = addNewPatient;
const updatePersonalInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid) {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            await new registration_1.default(patientid).UpdatePersonalInformation(req, res);
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error updating personal information", 500, res);
        }
    }
};
exports.updatePersonalInformation = updatePersonalInformation;
const updateEmergencyContactInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid) {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            const result = await new registration_1.default(patientid).emmergencyInformation(patientid, req.body);
            if (result === true) {
                res.send({
                    message: "record updated successfully",
                    statusCode: 200,
                    status: "success",
                });
            }
            else {
                res.send({
                    message: "No record updated",
                    statusCode: 200,
                    status: "error",
                });
            }
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error updating emergency contact information", 500, res);
        }
    }
};
exports.updateEmergencyContactInformation = updateEmergencyContactInformation;
const updateAddressingInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid || patientid == "undefined") {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            const records = req.body;
            const info = await new registration_1.default(patientid).addressingInformation(patientid, records);
            if (info === true) {
                res.send({
                    message: "record updated successfully",
                    statusCode: 200,
                    status: "success",
                });
            }
            else {
                res.send({
                    message: "No record updated",
                    statusCode: 200,
                    status: "success",
                });
            }
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error updating addressing information", 500, res);
        }
    }
};
exports.updateAddressingInformation = updateAddressingInformation;
const getPersonalInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid || patientid == "undefined" || patientid == "null") {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            const data = await queries_1.default.getsingleid(patientid, "new_patients", "PATIENTID");
            if (data.length > 0) {
                const dataOne = (0, helper_1.convertKeysToLowerCase)(data[0]);
                dataOne.maritalstatus = dataOne.marital_status;
                dataOne.mobile = parseInt(dataOne.mobile_number);
                dataOne.patientOrganization = dataOne.organization;
                const date = new Date(dataOne.dob);
                delete dataOne.marital_status;
                delete dataOne.mobile_number;
                delete dataOne.organization;
                dataOne.years = date.getFullYear();
                dataOne.months = date.getMonth() + 1;
                dataOne.days = date.getDate();
                dataOne.ageType = dataOne["agetype"];
                delete dataOne.agetype;
                res.send({ statusCode: 200, status: "success", result: dataOne });
            }
            else {
                res.send({ statusCode: 200, status: "success", result: [] });
            }
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error fetching personal information", 500, res);
        }
    }
};
exports.getPersonalInformation = getPersonalInformation;
const checkMobileNumber = async (req, res) => {
    const { mobileno } = req.query;
    if (!mobileno) {
        (0, helper_1.customError)("mobileno not included in the request", 400, res);
    }
    else {
        try {
            const data = await queries_1.default.getsingleid(mobileno, "new_patients", "mobile_number");
            res.send({ statusCode: 200, status: "success", exist: data.length > 0 });
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error checking mobile number", 500, res);
        }
    }
};
exports.checkMobileNumber = checkMobileNumber;
const getAddressingInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid) {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            const data = await queries_1.default.getsingleid(patientid, "patientsaddress", "patientid");
            if (data.length > 0) {
                res.send({ statusCode: 200, status: "success", result: data[0] });
            }
            else {
                res.send({ statusCode: 200, status: "success", result: [] });
            }
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error fetching addressing information", 500, res);
        }
    }
};
exports.getAddressingInformation = getAddressingInformation;
const getEmergencyContactInformation = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid) {
        (0, helper_1.customError)("patientid not included in the request", 400, res);
    }
    else {
        try {
            const data = await queries_1.default.getsingleid(patientid, "patientemmergencycontactinformation", "patientid");
            if (data.length > 0) {
                res.send({ statusCode: 200, status: "success", result: data[0] });
            }
            else {
                res.send({ statusCode: 200, status: "success", result: [] });
            }
        }
        catch (error) {
            console.error(error);
            (0, helper_1.customError)("Error fetching emergency contact information", 500, res);
        }
    }
};
exports.getEmergencyContactInformation = getEmergencyContactInformation;
const getRegistrationSettings = async (req, res) => {
    try {
        const settings = await new registration_1.default().isBulkRegistration();
        res.send({
            status: "success",
            message: "settings retrieved successfully",
            statusCode: 200,
            bulkRegistration: settings,
        });
    }
    catch (error) {
        console.error(error);
        (0, helper_1.customError)("Error fetching registration settings", 500, res);
    }
};
exports.getRegistrationSettings = getRegistrationSettings;
