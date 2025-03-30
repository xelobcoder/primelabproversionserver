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
const helper_1 = require("../../../../helper");
const logger_1 = require("../../../../logger");
const queries = __importStar(require("./queries"));
class Inventoryanalytics {
    constructor(stockid, departmentid) {
        this.stockid = stockid;
        this.departmentid = departmentid;
    }
    async getCustomizationData() {
        return await (0, helper_1.promisifyQuery)(queries.q_getCustomizationData);
    }
    parseJsonData(data) {
        if (data === "{}" || data === null || data === undefined)
            return false;
        return JSON.parse(data);
    }
    async customization() {
        const unparsed = await this.getCustomizationData();
        if (unparsed.length === 0)
            return;
        const { settings } = unparsed[0];
        return this.parseJsonData(settings);
    }
    async getNearExpiry(count = true) {
        const data = await this.customization();
        const nearExpiry = parseInt(data === null || data === void 0 ? void 0 : data.expirydays) + 1 || 22;
        const query = queries.q_getNearExpiry(count);
        const rowsCount = await (0, helper_1.promisifyQuery)(query, nearExpiry);
        if (count) {
            return rowsCount.length > 0 ? rowsCount[0]["count"] : 0;
        }
        return rowsCount;
    }
    async getBelowAlert(count = true) {
        const query = queries.q_getBelowAlert(count);
        const data = await (0, helper_1.promisifyQuery)(query);
        if (count) {
            return data.length > 0 ? data[0]["count"] : 0;
        }
        return data;
    }
    async getExpiredCount(count = true) {
        const query = queries.q_getExpiredCount(count);
        const data = await (0, helper_1.promisifyQuery)(query);
        if (count)
            return data.length > 0 ? data[0]["count"] : 0;
        return data;
    }
    async getInvSummaryAnalytics() {
        const data = await (0, helper_1.promisifyQuery)(queries.q_getInvSummaryAnalytics);
        return data.length > 0 ? this.parseJsonData(data[0]["settings"]) : {};
    }
    async getIncompOrdersCount(count) {
        try {
            const query = queries.q_getIncompOrdersCount(count);
            const result = await (0, helper_1.promisifyQuery)(query);
            if (count === true) {
                return result.length > 0 ? result[0]["count"] : null;
            }
            return result;
        }
        catch (err) {
            throw new Error(err);
        }
    }
    async completeOrdersCount(count, t = { page: 1, count: 10 }) {
        try {
            let query = queries.q_completeOrdersCount(count);
            if (count === true) {
                const result = await (0, helper_1.promisifyQuery)(query);
                return result.length > 0 ? result[0]["count"] : 0;
            }
            query += ` LIMIT ? OFFSET ?`;
            const result = await (0, helper_1.paginationQuery)(t, query);
            return result;
        }
        catch (err) {
            logger_1.logger.error(err);
            throw new Error(err);
        }
    }
    async updateInvenAnalSummary() {
        const { update: updateQ, insert: insertQ } = queries.q_updateInvenAnalSummary;
        try {
            const n = await this.getNearExpiry();
            const e = await this.getExpiredCount();
            const b = await this.getBelowAlert();
            const getSettings = await (0, helper_1.promisifyQuery)(queries.q_getInvSummaryAnalytics);
            const data = JSON.stringify({ nearExpiryCount: n, belowAlertLevel: b, expiredCount: e });
            const isAvail = getSettings.length > 0;
            if (isAvail) {
                await (0, helper_1.promisifyQuery)(updateQ, [data]);
            }
            else {
                await (0, helper_1.promisifyQuery)(insertQ, [data]);
            }
        }
        catch (err) {
            logger_1.logger.error(err);
            throw new Error(err);
        }
    }
    async quartersReducer(result) {
        if (!result || !Array.isArray(result))
            return null;
        const reducer = (data) => data.reduce((sum, current) => sum + (current === null || current === void 0 ? void 0 : current.debitAmount), 0);
        const totalWastage = reducer(result);
        const firstQ = reducer(result.filter((a, b) => a.quarter === 1));
        const secondQ = reducer(result.filter((a, b) => a.quarter === 2));
        const thirdQ = reducer(result.filter((a, b) => a.quarter === 3));
        return {
            firstQ,
            secondQ,
            thirdQ,
            totalWastage,
        };
    }
    async getWastagePerQuarters() {
        let query = queries.q_getWastagePerQuarters;
        let result = await (0, helper_1.promisifyQuery)(query);
        if (result.length === 0)
            return result;
        return this.quartersReducer(result);
    }
    async getDepartmentWastageByQuartersSummary(departmentid) {
        if (!departmentid)
            throw new Error("departmentid required");
        const departmentWastageQuarters = queries.q_getDepartmentWastageByQuartersSummary;
        const data = await (0, helper_1.promisifyQuery)(departmentWastageQuarters, [departmentid]);
        return await this.quartersReducer(data);
    }
}
exports.default = Inventoryanalytics;
