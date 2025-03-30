"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_1 = require("./billing");
const queries_1 = require("./queries");
const helper_js_1 = require("./../../../helper.js");
class Sales extends billing_1.Billing {
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
    async getDailySalesSummary(branchid) {
        var query = queries_1.q_dailySalesSummary;
        if (typeof branchid === "number") {
            query += ` AND branchid = ?`;
        }
        const summary = await (0, helper_js_1.promisifyQuery)(queries_1.q_dailySalesSummary, [branchid]);
        return summary;
    }
}
