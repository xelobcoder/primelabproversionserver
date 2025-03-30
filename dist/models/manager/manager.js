"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const logger_1 = __importDefault(require("../../../logger"));
const queries_1 = require("./queries");
class Manager {
    constructor(employeeid, billingid, testid) {
        this.employeeid = employeeid;
        this.billingid = billingid;
        this.testid = testid;
    }
    getManagerApprovals(duration) {
        let defaultDuration = "daily";
    }
    async verificationManager() {
        try {
            const result = await (0, helper_1.promisifyQuery)(queries_1.getRoleQuery, [this.employeeid]);
            return result.length > 0 && result[0]["role"].toLowerCase() === "manager";
        }
        catch (err) {
            logger_1.default.error(err === null || err === void 0 ? void 0 : err.message);
            throw new Error(err);
        }
    }
    insertApproval(approvalStatus, message = null) {
        try {
            let query = queries_1.insertApprovalQuery;
            const values = [approvalStatus, this.employeeid, message, this.billingid, this.testid];
            return (0, helper_1.promisifyQuery)(query, values);
        }
        catch (err) {
            logger_1.default.error((err === null || err === void 0 ? void 0 : err.message) || message);
            throw new Error(err);
        }
    }
    async getReadyForApprovals(request, response) {
        try {
            let query = queries_1.getReadyForApprovalsQuery;
            let result = await (0, helper_1.promisifyQuery)(query);
            if (result.length > 0) {
                result = result.sort((a, b) => a.urgency - b.urgency);
                response.send(result);
            }
            else {
                response.send(result);
            }
        }
        catch (err) {
            logger_1.default.error(err.message);
            (0, helper_1.customError)(err === null || err === void 0 ? void 0 : err.message, 500, response);
        }
    }
}
exports.default = Manager;
