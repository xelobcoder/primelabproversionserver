"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper");
const queries = __importStar(require("./sqlqueries"));
class EmailQueries {
    constructor(billingid) {
        this.billingid = billingid;
    }
    async isEmailServiceActivated() {
        const appset = await (0, helper_1.promisifyQuery)(queries.SELECT_EMAIL_NOTIFICATION);
        if (appset.length == 0)
            return false;
        const emailActivation = appset[0]["emailNotification"];
        return emailActivation === "0" ? false : true;
    }
    async getEmailPreference() {
        return await (0, helper_1.promisifyQuery)(queries.SELECT_EMAIL_PREFERENCE);
    }
    async getEmailLog(start, limit = 10, response) {
        try {
            if (!start)
                return false;
            const end = start + limit;
            const query = queries.SELECT_EMAIL_LOG;
            const result = await (0, helper_1.promisifyQuery)(query, [start, end, limit]);
            if (!response)
                return result;
            response.send({ message: "success", statusCode: 200, result });
        }
        catch (err) {
            console.error(err);
            if (response)
                this.customError(err, 404, response);
        }
    }
    async getTempClinicianCredentials(id) {
        try {
            if (!id)
                return null;
            return await (0, helper_1.promisifyQuery)(queries.SELECT_TEMP_CLINICIAN_CREDENTIALS, [id]);
        }
        catch (err) {
            console.error(err);
        }
    }
    async customSearch(record) {
        try {
            const { email, category } = record;
            let result;
            switch (category) {
                case "staff":
                    result = await (0, helper_1.promisifyQuery)(queries.SELECT_STAFF_EMAIL, [`%${email}%`]);
                    result = result.map((item) => ({
                        fullname: item.username,
                        email: item.email,
                        employeeid: item.employeeid,
                    }));
                    break;
                case "clients":
                    result = await (0, helper_1.promisifyQuery)(queries.SELECT_CLIENTS_EMAIL, [`%${email}%`]);
                    break;
                case "bulk clients":
                    result = await (0, helper_1.promisifyQuery)(queries.SELECT_ALL_CLIENTS_EMAIL);
                    break;
                case "bulk staff":
                    result = await (0, helper_1.promisifyQuery)(queries.SELECT_ALL_STAFF_EMAIL);
                    break;
                default:
                    result = [];
                    break;
            }
            return result;
        }
        catch (err) {
            console.error(err);
            return "error occurred";
        }
    }
    async saveComposedEmailDraft(subject, draft, employeeid) {
        try {
            const query = queries.INSERT_COMPOSED_EMAIL;
            const result = await (0, helper_1.promisifyQuery)(query, [subject, draft, employeeid]);
            return result.affectedRows > 0;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async updateEmailComposed(id, subject, draft, employeeid) {
        try {
            const query = queries.UPDATE_COMPOSED_EMAIL;
            const result = await (0, helper_1.promisifyQuery)(query, [subject, draft, employeeid, id]);
            return result.affectedRows > 0;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async updateEmailTarget(id, target, schedule) {
        if (!target || !id)
            return "provide target and id";
        if (typeof id !== "number")
            return new TypeError("id must be type number");
        try {
            const update = queries.UPDATE_EMAIL_TARGET;
            return await (0, helper_1.promisifyQuery)(update, [target, "true", schedule, id]);
        }
        catch (err) {
            throw new Error(err === null || err === void 0 ? void 0 : err.message);
        }
    }
    async sendBulkEmails(id, target, category) {
        try {
            if (!id || !category)
                return "id and category are required";
            const table = category === "bulk clients" ? "new_patients" : "roles";
            const query = queries.SELECT_BULK_EMAILS.replace("{table}", table);
            const array = await (0, helper_1.promisifyQuery)(query);
            const getEmailInfo = await this.getComposedEmailDraft(null, 1, "full", id);
            if (getEmailInfo.length == 0)
                return false;
            const { subject, body } = getEmailInfo[0];
            if (!Array.isArray(array))
                return new TypeError("array must be type array");
            if (array.length == 0)
                return false;
            // Adjust your logic for sending emails
            return true;
        }
        catch (err) {
            console.error(err);
            return false || (err === null || err === void 0 ? void 0 : err.message);
        }
    }
    async sendComposedEmail(records) {
        try {
            const { subject, body, email } = records;
            if (!subject || !email || !body)
                return false;
            const html = `<html><body>${body}</body></html>`;
            // Implement mailOptions and transportEmail methods
            // const mailOptions = this.mailOptions(email, subject, html);
            // return this.transportEmail(mailOptions);
            return true; // Placeholder for sending logic
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async isAddressAuthenticated(email, target) {
        if (!email || !target)
            return "email and target are required";
        // Implementation based on target
    }
    async publishEmail(records) {
        try {
            const { id, target, category, schedule } = records;
            // Implementation
            return true; // Placeholder for implementation
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    async getComposedEmailDraft(target, limit = 20, mode, id) {
        try {
            let query = queries.SELECT_COMPOSED_EMAILS.replace("{mode}", mode);
            let values = [];
            if (target == "draft") {
                query += ` WHERE ispublished = 'false'`;
            }
            if (target == "published") {
                query += ` WHERE ispublished = 'true'`;
            }
            if (id != null && target) {
                query += ` AND id = ?`;
                values.push(id);
            }
            if (id != null && !target) {
                query += ` WHERE id = ?`;
                values.push(id);
            }
            query += ` ORDER BY id DESC LIMIT ?`;
            values.push(limit);
            return await (0, helper_1.promisifyQuery)(query, values);
        }
        catch (err) {
            console.error(err);
            return err === null || err === void 0 ? void 0 : err.message;
        }
    }
    async getEmailSummaryByDay(response) {
        try {
            const query = queries.SELECT_EMAIL_SUMMARY_BY_DAY;
            const result = await (0, helper_1.promisifyQuery)(query);
            if (response)
                response.send({ status: "success", statusCode: 200, result });
            return result;
        }
        catch (err) {
            console.error(err);
            if (response) {
                // customError(err, 404, response);
                return;
            }
            return "error occurred";
        }
    }
    async emailSummary(response) {
        try {
            const query = queries.SELECT_EMAIL_SUMMARY;
            const result = await (0, helper_1.promisifyQuery)(query);
            if (response)
                return response.send({ status: "success", statusCode: 200, result });
            return result;
        }
        catch (err) {
            console.error(err);
            if (response) {
                // customError(err, 404, response);
                return;
            }
            return "error occurred";
        }
    }
    async isEmailAuthenticated(identifier, target) {
        try {
            let result = [];
            if (target === "patient") {
                result = await (0, helper_1.promisifyQuery)(queries.SELECT_PATIENT_AUTHENTICATION, [identifier]);
                if (result.length === 0)
                    return false;
                const { authenticated, authenticationMode } = result[0];
                return authenticationMode === "email" && authenticated == 1;
            }
            if (target === "clinician") {
                result = await (0, helper_1.promisifyQuery)(queries.SELECT_CLINICIAN_AUTHENTICATION, [identifier]);
                if (result.length === 0)
                    return false;
                const { isAuthenticated, authenticationMode } = result[0];
                return authenticationMode === "email" && isAuthenticated == 1;
            }
            return result;
        }
        catch (err) {
            console.error(err);
            return new Error(err);
        }
    }
    async updateAuthMode(target, identifier) {
        if (!identifier || !target)
            return "required params not provided";
        try {
            let query = "";
            if (target === "patient") {
                query = queries.UPDATE_PATIENT_AUTH_MODE;
            }
            if (target === "clinician") {
                query = queries.UPDATE_CLINICIAN_AUTH_MODE;
            }
            if (!query)
                return false;
            return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [identifier]));
        }
        catch (err) {
            throw new Error(err);
        }
    }
}
exports.default = EmailQueries;
