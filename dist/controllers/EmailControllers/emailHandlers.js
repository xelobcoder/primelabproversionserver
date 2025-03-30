"use strict";
// src/emailHandlers.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailToken = exports.renderVerifyEmailPage = exports.publishEmail = exports.updateEmailComposed = exports.getComposedEmailDraft = exports.saveComposedEmailDraft = exports.customSearch = exports.getEmailLog = exports.getEmailSummaryByDay = exports.emailSummary = void 0;
const helper_1 = require("../../../helper");
const EmailCore_1 = __importDefault(require("../EmailServices/EmailCore"));
const node_path_1 = __importDefault(require("node:path"));
const emailService = new EmailCore_1.default();
const emailSummary = async (req, res) => {
    await emailService.emailSummary(res);
};
exports.emailSummary = emailSummary;
const getEmailSummaryByDay = async (req, res) => {
    await emailService.getEmailSummaryByDay(res);
};
exports.getEmailSummaryByDay = getEmailSummaryByDay;
const getEmailLog = async (req, res) => {
    await emailService.getEmailLog(1, 20, res);
};
exports.getEmailLog = getEmailLog;
const customSearch = async (req, res) => {
    const { email, category } = req.query;
    if (!email || !category) {
        (0, helper_1.customError)(res, 400, "Email and Category are required");
        return;
    }
    const result = await emailService.customSearch(req.query, res);
    Array.isArray(result) ? res.send({ statusCode: 200, result }) : res.send({ statusCode: 400, message: result });
};
exports.customSearch = customSearch;
const saveComposedEmailDraft = async (req, res) => {
    const { subject, draft, employeeid } = req.body;
    if (!subject || !draft || !employeeid) {
        (0, helper_1.customError)(res, 404, "Subject, Draft, and employeeid are required");
        return;
    }
    const result = await emailService.saveComposedEmailDraft(subject, draft, employeeid);
    res.send({
        message: result === 1 ? "Draft saved successfully" : "Error saving draft",
        statusCode: result === 1 ? 200 : 400,
        status: result === 1 ? "success" : "error",
    });
};
exports.saveComposedEmailDraft = saveComposedEmailDraft;
const getComposedEmailDraft = async (req, res) => {
    const { mode, id, target, limit } = req.query;
    try {
        const result = await emailService.getComposedEmailDraft(target, limit, mode, id);
        res.send({ statusCode: 200, result, status: "success" });
    }
    catch (error) {
        (0, helper_1.customError)(res, 400, (error === null || error === void 0 ? void 0 : error.message) || "Error getting draft");
    }
};
exports.getComposedEmailDraft = getComposedEmailDraft;
const updateEmailComposed = async (req, res) => {
    const { id, subject, draft, employeeid } = req.body;
    if (!id || !subject || !draft || !employeeid) {
        (0, helper_1.customError)(res, 404, "Id, Subject, Draft, and employeeid are required");
        return;
    }
    const result = await emailService.updateEmailComposed(id, subject, draft, employeeid);
    res.send({
        message: result === 1 ? "Draft updated successfully" : "Error updating draft",
        statusCode: result === 1 ? 200 : 400,
        status: result === 1 ? "success" : "error",
    });
};
exports.updateEmailComposed = updateEmailComposed;
const publishEmail = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        (0, helper_1.customError)(res, 404, "Id is required");
        return;
    }
    const result = await emailService.publishEmail(req.body);
    res.send({ statusCode: 200, message: result, status: "success" });
};
exports.publishEmail = publishEmail;
const renderVerifyEmailPage = (req, res) => {
    res.render(node_path_1.default.join(__dirname, "../views/pages/verifyemail.ejs"));
};
exports.renderVerifyEmailPage = renderVerifyEmailPage;
const verifyEmailToken = async (req, res) => {
    const { token } = req.query;
    try {
        const isVerify = await emailService.verifyClientAuthToken(token);
        if (typeof isVerify === "string") {
            (0, helper_1.customError)(res, 400, isVerify);
            return;
        }
        if (isVerify) {
            res.send({
                statusCode: 200,
                message: "Email verified successfully. Temporary access credentials will be sent to your mail. Kindly access it and use it to login to your portal. You are advised to quickly update credentials as soon as possible",
                status: "success",
            });
        }
    }
    catch (err) {
        (0, helper_1.customError)(res, 400, "Link is expired");
    }
};
exports.verifyEmailToken = verifyEmailToken;
