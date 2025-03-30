"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sales = void 0;
const billing_js_1 = require("../billing.js");
const queries_js_1 = require("./queries.js");
const helper_js_1 = require("../../../../helper.js");
class Sales extends billing_js_1.Billing {
    constructor(branchid, patientid) {
        super(patientid);
        this.branchid = branchid;
    }
    getYearlySalesSummary(branchid) {
        throw new Error("Method not implemented.");
    }
    getMonthlySalesSummary(branchid) {
        throw new Error("Method not implemented.");
    }
    getMonthDailySalesSummary(branchid) {
        throw new Error("Method not implemented.");
    }
    getMonthWeeklySalesSummary(branchid) {
    }
    async getDailySalesSummary(branchid) {
        var query = queries_js_1.q_dailySalesSummary;
        if (typeof branchid === "number") {
            query += ` AND branchid = ?`;
        }
        const summary = await (0, helper_js_1.promisifyQuery)(queries_js_1.q_dailySalesSummary, [branchid]);
        return summary;
    }
}
exports.Sales = Sales;
