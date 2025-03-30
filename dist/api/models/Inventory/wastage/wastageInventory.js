"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../../helper");
const inventoryClass_1 = __importDefault(require("../inventoryClass/inventoryClass"));
const queries_1 = require("./queries");
class WastageInventory extends inventoryClass_1.default {
    constructor(stockid) {
        super(stockid);
        this.stockid = stockid;
    }
    async calculateProductInstock(stockid, brand, batchnumber) {
        const data = await (0, helper_1.promisifyQuery)(queries_1.SELECT_PRODUCT_INSTOCK_QUERY, [stockid, batchnumber, brand]);
        const qtyReceived = data.length > 0 ? data[0]["qty"] : 0;
        return qtyReceived;
    }
    async getOrderWastageData(stockid, brandid, batchnumber) {
        return await (0, helper_1.promisifyQuery)(queries_1.SELECT_ORDER_WASTAGE_DATA_QUERY, [stockid, brandid, batchnumber]);
    }
    async calcalulateWastageTotal(stockid, brandid, batchnumber) {
        if (!stockid || !batchnumber || !brandid)
            throw new Error("batchnumber, stockid, and brandid are required");
        let data = await this.getOrderWastageData(stockid, brandid, batchnumber);
        if (data.length === 0)
            return 0;
        data = data.reduce((acc, cur) => acc + (cur === null || cur === void 0 ? void 0 : cur.debitqty), 0);
        return data;
    }
    async updateOrdersWastage(productordersid, state) {
        return await (0, helper_1.promisifyQuery)(queries_1.UPDATE_ORDERS_WASTAGE_QUERY, [state, productordersid]);
    }
    async isWastageDebitHxExist(productordersid) {
        const result = await (0, helper_1.promisifyQuery)(queries_1.SELECT_WASTAGE_DEBIT_HX_QUERY, [productordersid]);
        return result.length > 0;
    }
    async disposeoffExpireProduct(records) {
        const { productordersid, brandid, stockid, batchnumber } = records;
        if (!productordersid) {
            throw new Error("Required keys not found in object provided");
        }
        if (await this.isWastageDebitHxExist(productordersid))
            return "EXIST";
        const total = await this.calculateProductInstock(stockid, brandid, batchnumber);
        try {
            await this.addDebitHx(productordersid, stockid, batchnumber, brandid, total, 1);
            await this.updateOrdersWastage(productordersid, 1);
            return true;
        }
        catch (err) {
            throw new Error(err);
        }
    }
    async disposeoffDeptProduct(records) {
        const { brandid, stockid, batchnumber, departmentid, employeeid } = records;
        if (!departmentid || !stockid || !batchnumber || !brandid || !employeeid) {
            throw new Error("departmentid, batchnumber, employeeid, brandid, and stockid required");
        }
        const queryR = await (0, helper_1.promisifyQuery)(queries_1.UPDATE_DEPT_PRODUCT_DISPOSE_QUERY, [1, employeeid, departmentid, batchnumber, brandid, stockid]);
        const isdisposed = (0, helper_1.rowAffected)(queryR);
        return isdisposed;
    }
    async getQuarterlyData(quarters, count = 10, page = 1) {
        if (!quarters || !(quarters < 4 && quarters > 0)) {
            throw new Error("Quarters are required and must be between 1 and 3");
        }
        let query = queries_1.SELECT_QUARTERLY_DATA_QUERY;
        if (quarters === 1)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`;
        if (quarters === 2)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`;
        if (quarters === 3)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 9 AND 12`;
        return await (0, helper_1.paginationQuery)({ count, page }, query);
    }
    async getMonthlySummaryByQuarters(quarters) {
        let query = queries_1.SELECT_MONTHLY_SUMMARY_QUERY;
        if (quarters === 1)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`;
        if (quarters === 2)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`;
        if (quarters === 3)
            query += ` AND MONTH(dhx.debitdate)  BETWEEN 9 AND 12`;
        return await (0, helper_1.promisifyQuery)(query);
    }
    async getDeptMonthlySummaryWastages(quarters, departmentid) {
        if (!departmentid || !quarters || quarters <= 0 || quarters > 3) {
            throw new Error("Departmentid and quarters are required, and quarters must be between 1 and 3.");
        }
        let query = queries_1.SELECT_DEPT_MONTHLY_SUMMARY_QUERY;
        if (quarters === 1)
            query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`;
        if (quarters === 2)
            query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`;
        if (quarters === 3)
            query += ` AND MONTH(dchx.date)  BETWEEN 9 AND 12`;
        return await (0, helper_1.promisifyQuery)(query, [departmentid]);
    }
    async getDeptQuarterlyWastageData(quarters, departmentid, count = 10, page = 1) {
        if (!quarters || !(quarters < 4 && quarters > 0) || !departmentid) {
            throw new Error("Quarters and departmentid are required, and quarters must be between 1 and 3.");
        }
        let query = queries_1.SELECT_DEPT_QUARTERLY_DATA_QUERY;
        if (quarters === 1)
            query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`;
        if (quarters === 2)
            query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`;
        if (quarters === 3)
            query += ` AND MONTH(dchx.date)  BETWEEN 9 AND 12`;
        return await (0, helper_1.paginationQuery)({ count, page }, query, [departmentid]);
    }
}
exports.default = WastageInventory;
