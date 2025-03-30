"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postProcessedOrderHandler = exports.getTemporaryOrdersProcessingHandler = exports.getTemporaryOrdersHandler = exports.postTemporaryOrderHandler = exports.getBillingTestBasedByClinicianHandler = exports.getClinicianResultHandler = exports.filterClinicianHandler = exports.getTopPerformingCliniciansHandler = exports.postCliniciansHandler = exports.deleteCliniciansHandler = exports.putCliniciansHandler = exports.getSingleClinicianHandler = exports.getCliniciansHandler = void 0;
const clinicians_1 = require("../../api/clinicians");
const helper_1 = require("../../helper");
const logger_1 = __importDefault(require("../../logger"));
const EmailCore_1 = __importDefault(require("../EmailServices/EmailCore"));
const billing_1 = require("../../api/billing");
const registration_1 = __importDefault(require("../models/registration"));
async function getCliniciansHandler(req, res) {
    (0, clinicians_1.getClinicians)(req, res);
}
exports.getCliniciansHandler = getCliniciansHandler;
async function getSingleClinicianHandler(req, res) {
    const { id } = req.query;
    if (!id) {
        (0, helper_1.customError)("clinicianid required", 404, res);
    }
    else {
        (0, clinicians_1.getSingleClinician)(req, res);
    }
}
exports.getSingleClinicianHandler = getSingleClinicianHandler;
async function putCliniciansHandler(req, res) {
    (0, clinicians_1.putCliniciansbasic)(req, res);
}
exports.putCliniciansHandler = putCliniciansHandler;
async function deleteCliniciansHandler(req, res) {
    (0, clinicians_1.deleteClinicians)(req, res);
}
exports.deleteCliniciansHandler = deleteCliniciansHandler;
async function postCliniciansHandler(req, res) {
    var _a;
    try {
        const outcome = await (0, clinicians_1.postClinicianBasicInfo)(req, res);
        if (typeof outcome !== "number" || typeof outcome === "string") {
            (0, helper_1.customError)(outcome, 404, res);
            return;
        }
        res.send({ message: "clinician added successfully", statusCode: 200, status: "success" });
        await new EmailCore_1.default().fireClientAuthentication((_a = req.body) === null || _a === void 0 ? void 0 : _a.email, "clinician", outcome);
    }
    catch (err) {
        (0, helper_1.customError)("Something wrong ocured", 500, res);
    }
}
exports.postCliniciansHandler = postCliniciansHandler;
async function getTopPerformingCliniciansHandler(req, res) {
    (0, clinicians_1.getTopPerformingClinicians)(req, res);
}
exports.getTopPerformingCliniciansHandler = getTopPerformingCliniciansHandler;
async function filterClinicianHandler(req, res) {
    const { data } = req.body;
    if (!data) {
        (0, helper_1.customError)("please add data", 401, res);
        return;
    }
    try {
        const result = await new registration_1.default().filterPatientUsingClient(data);
        res.send({ status: "success", statusCode: 200, result });
    }
    catch (err) {
        (0, helper_1.customError)("Something wrong ocured", 500, res);
    }
}
exports.filterClinicianHandler = filterClinicianHandler;
async function getClinicianResultHandler(req, res) {
    try {
        const { clinicianid, startdate, enddate } = req.query;
        if (!clinicianid) {
            (0, helper_1.customError)("please add clinicianid", 401, res);
            return;
        }
        const result = await (0, clinicians_1.getClinicianResult)(clinicianid, startdate, enddate);
        res.send({ status: "success", statusCode: 200, result });
    }
    catch (err) {
        logger_1.default.error(err);
        (0, helper_1.customError)(err, 401, res);
    }
}
exports.getClinicianResultHandler = getClinicianResultHandler;
async function getBillingTestBasedByClinicianHandler(req, res) {
    try {
        const { billingid, clinicianid } = req.query;
        if (!billingid || !clinicianid) {
            (0, helper_1.customError)("please add billingid and clinicianid", 401, res);
            return;
        }
        const result = await (0, clinicians_1.getBillingTestBasedByClinician)(billingid, clinicianid);
        res.send({ statusCode: 200, status: "success", result });
    }
    catch (err) {
        logger_1.default.error(err);
        (0, helper_1.customError)((err === null || err === void 0 ? void 0 : err.message) || "something went wrong", 500, res);
    }
}
exports.getBillingTestBasedByClinicianHandler = getBillingTestBasedByClinicianHandler;
async function postTemporaryOrderHandler(req, res) {
    try {
        const result = await new registration_1.default().temporaryOrder(req.body);
        if (result === true) {
            res.send({ statusCode: 200, status: "success", message: "order added successfully" });
        }
        else {
            const message = result === false ? "kindly update orders in the order page" : "something went wrong while trying to add order";
            (0, helper_1.customError)(message, 500, res);
        }
    }
    catch (err) {
        (0, helper_1.customError)("Something wrong ocured", 500, res);
    }
}
exports.postTemporaryOrderHandler = postTemporaryOrderHandler;
async function getTemporaryOrdersHandler(req, res) {
    const { clinicianid, target, date } = req.query;
    if (!target) {
        (0, helper_1.customError)("please addd target for query ", 401, res);
        return;
    }
    try {
        const result = await new registration_1.default().getTemporaryOrders(target, clinicianid, date);
        res.send({ statusCode: 200, status: "success", result });
    }
    catch (err) {
        (0, helper_1.customError)("Something wrong ocured", 500, res);
    }
}
exports.getTemporaryOrdersHandler = getTemporaryOrdersHandler;
async function getTemporaryOrdersProcessingHandler(req, res) {
    const { orderid } = req.query;
    if (!orderid) {
        (0, helper_1.customError)("please add id", 401, res);
        return;
    }
    try {
        const result = await new registration_1.default().getTemporaryOrdersProcessing(orderid);
        res.send({ statusCode: 200, status: "success", result });
    }
    catch (err) {
        (0, helper_1.customError)("Something wrong ocured", 500, res);
    }
}
exports.getTemporaryOrdersProcessingHandler = getTemporaryOrdersProcessingHandler;
async function postProcessedOrderHandler(req, res) {
    try {
        const { patientid, clinician, organization, orderid, test, payable, testcost, paid, taxIncluded, taxValue, status, discount, paymentmode, samplingCenter, outstanding, cost, employeeid, } = req.body;
        if (!employeeid || !clinician) {
            (0, helper_1.customError)("Bill can initiation failed, include employeeid and clincianid", 404, res);
            return;
        }
        const billing = new billing_1.Billing(patientid, clinician, organization, test, payable, testcost, paid, taxIncluded, taxValue, status, discount, paymentmode, samplingCenter, outstanding, cost);
        const outcome = await billing.insertionProcess(req, res, employeeid, false);
        if (typeof outcome === "string") {
            (0, helper_1.customError)(outcome, 404, res);
            return;
        }
        if (typeof outcome === "boolean") {
            if (outcome !== true) {
                (0, helper_1.customError)("error in processsing order", 404, res);
                return;
            }
            const isUpdated = await new registration_1.default().updateProcessedOrder(orderid);
            if (!isUpdated) {
                (0, helper_1.customError)("error processing order", 500, res);
                return;
            }
            res.send({ message: "order processed successfully", statusCode: 200, status: "success" });
        }
    }
    catch (err) {
        console.log(err);
        (0, helper_1.customError)((err === null || err === void 0 ? void 0 : err.message) || err, 500, res);
    }
}
exports.postProcessedOrderHandler = postProcessedOrderHandler;
