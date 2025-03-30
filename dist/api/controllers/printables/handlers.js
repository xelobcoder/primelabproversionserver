"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingReceipt = exports.getTransactionApprovedTest = exports.getBillingInvoice = exports.makeDecisionOnResult = exports.checkApproval = exports.getResultEntryScientist = exports.getPreviewComments = exports.previewReport = exports.updatePayment = exports.getClientTransactionHistory = exports.getPaymentModes = exports.clearClientOutstandingDebt = exports.getClientBulkOutstanding = exports.getClientTransactionInfo = exports.getSummaryReadyPage = exports.updatePrintCount = exports.getResultById = exports.getAdvancedTablesSearch = exports.getResultReady = void 0;
const helper_1 = require("../../../helper");
const resultPrint_1 = __importDefault(require("../../models/result/resultPrint"));
const invoice_1 = require("../../models/invoice/invoice");
const payments_1 = __importDefault(require("../../models/payments/payments"));
const payment = new payments_1.default(null);
const getResultReady = async (req, res) => {
    try {
        const result = await new resultPrint_1.default(null).get_printables(req.query);
        res.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getResultReady = getResultReady;
const getAdvancedTablesSearch = async (req, res) => {
    try {
        const result = await new resultPrint_1.default(null).advancedTablesSearch(req.query);
        res.send({ status: "success", statusCode: 200, result });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getAdvancedTablesSearch = getAdvancedTablesSearch;
const getResultById = async (req, res) => {
    try {
        const billingid = parseInt(req.params.id.slice(1));
        if (!billingid)
            return (0, helper_1.customError)("billingid not provided", 404, res);
        const result = await new resultPrint_1.default(null).get_extrainfo_test(billingid);
        res.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getResultById = getResultById;
const updatePrintCount = async (req, res) => {
    try {
        const { id, count } = req.body;
        if (!id || !count)
            return (0, helper_1.customError)("test ascension id and count of print required", 404, res);
        const result = await new resultPrint_1.default(null).updatePrintCount(id, count);
        res.send({ status: result === true ? "success" : "failed" });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.updatePrintCount = updatePrintCount;
const getSummaryReadyPage = async (req, res) => {
    try {
        const result = await new resultPrint_1.default(null).get_summary_ready_page(req.query);
        res.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getSummaryReadyPage = getSummaryReadyPage;
const getClientTransactionInfo = async (req, res) => {
    try {
        const result = await payment.getClientTransactionInformation(req.query, res);
        res.send({ result, statusCode: 200, status: "success" });
    }
    catch (err) {
        (0, helper_1.customError)(err === null || err === void 0 ? void 0 : err.message, 500, res);
    }
};
exports.getClientTransactionInfo = getClientTransactionInfo;
const getClientBulkOutstanding = async (req, res) => {
    const { patientid } = req.query;
    if (!patientid) {
        (0, helper_1.customError)("patientid required", 404, res);
    }
    else {
        const result = await payment.allClientDebtTransactions(patientid);
        res.send({ result, statusCode: 200, status: "success" });
    }
};
exports.getClientBulkOutstanding = getClientBulkOutstanding;
const clearClientOutstandingDebt = async (req, res) => {
    try {
        const { patientid, paymentmode, amountpaid, employeeid } = req.body;
        if (!patientid || !paymentmode || !amountpaid || !employeeid) {
            return (0, helper_1.customError)("include amountpaid, paymentmode, employeeid and patientid in request body", 404, res);
        }
        const result = await payment.clearClientDebtBulk(patientid, amountpaid, paymentmode, employeeid);
        if (result === true) {
            res.send({ message: "updated successfully", status: "success", statusCode: "200" });
        }
        else if (result === "No Exist") {
            res.send({ message: "No debt available to clear", status: "error", statusCode: "500" });
        }
        else {
            res.send({ message: "updated failed", status: "failed", statusCode: "500" });
        }
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.clearClientOutstandingDebt = clearClientOutstandingDebt;
const getPaymentModes = (req, res) => {
    payment.paymentMode(req, res);
};
exports.getPaymentModes = getPaymentModes;
const getClientTransactionHistory = (req, res) => {
    payment.specificBillTransactionHx(req, res);
};
exports.getClientTransactionHistory = getClientTransactionHistory;
const updatePayment = (req, res) => {
    payment.updatePayment(req, res);
};
exports.updatePayment = updatePayment;
const previewReport = async (req, res) => {
    try {
        const result = await new resultPrint_1.default(null).previewReport(req, res);
        res.send({ result });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.previewReport = previewReport;
const getPreviewComments = (req, res) => {
    const { billingid, testid } = req.query;
    if (billingid) {
        const billid = parseInt(billingid);
        new resultPrint_1.default(billid).getComments(billingid, parseInt(testid), res);
    }
    else {
        res.send({ status: "error", statusCode: 401, message: "Include Billingid" });
    }
};
exports.getPreviewComments = getPreviewComments;
const getResultEntryScientist = async (req, res) => {
    try {
        const { testid, billingid } = req.query;
        if (!billingid || !testid) {
            return (0, helper_1.customError)("billingid or testid not included in the query", 404, res);
        }
        const result = await new resultPrint_1.default(null).getResultEntryScientist(billingid, testid);
        res.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getResultEntryScientist = getResultEntryScientist;
const checkApproval = async (req, res) => {
    const { billingid, testid } = req.body;
    if (billingid && testid) {
        const approved = await new resultPrint_1.default(null).checkApproval(billingid, testid);
        res.send({ approved });
    }
    else {
        res.status(401).json({ status: "error", message: "include testid and billing in request body" });
    }
};
exports.checkApproval = checkApproval;
const makeDecisionOnResult = async (req, res) => {
    try {
        const result = await new resultPrint_1.default(null).makeDecisionOnResult(req.body);
        result
            ? res.send({ status: "success", statusCode: 200, message: "update successful" })
            : res.send({ status: "error", statusCode: 401, message: "error updating data" });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.makeDecisionOnResult = makeDecisionOnResult;
const getBillingInvoice = (req, res) => {
    const { billingid } = req.query;
    (0, invoice_1.getBillingInvoiceData)(billingid, res);
};
exports.getBillingInvoice = getBillingInvoice;
// export const emailBillingReceipt = async (req: Request, res: Response) => {
//   const { billingid } = req.query;
//   if (billingid) {
//     await new EmailService().forwardBillingReceipt(billingid);
//   } else {
//     customError("billing id required", 404, res);
//   }
// };
const getTransactionApprovedTest = async (req, res) => {
    try {
        const { billingid } = req.query;
        const result = await new resultPrint_1.default(billingid).getTransactionApprovedTest(billingid);
        res.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getTransactionApprovedTest = getTransactionApprovedTest;
const getBillingReceipt = async (req, res) => {
    const { billingid } = req.query;
    if (!billingid) {
        (0, helper_1.customError)("billingid not provided", 404, res);
    }
};
exports.getBillingReceipt = getBillingReceipt;
