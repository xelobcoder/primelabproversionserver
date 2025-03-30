"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const helper_1 = require("../../../../helper");
const logger_1 = __importDefault(require("../../../../logger"));
const queries_1 = require("./queries");
// const database_queries = require("../../database/queries");
class Inventory {
    constructor(stockid) {
        this.stockid = stockid || null;
    }
    async checkStockExist(stockname) {
        const item = await (0, helper_1.promisifyQuery)(`SELECT * FROM generalstocks WHERE name = ?`, [stockname]);
        return item.length > 0;
    }
    async addNewStock(records) {
        const { name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf } = records;
        if (await this.checkStockExist(name))
            return "EXIST";
        if (!category || typeof category !== "number" || !name)
            throw new Error("category of type number required and name required");
        const values = [name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf];
        const pushStock = await (0, helper_1.promisifyQuery)(queries_1.NEWSTOCKQUERY, values);
        return (0, helper_1.rowAffected)(pushStock);
    }
    async updateAstock(records) {
        const { stockid, name, category, consumptionunit, purchaseunit, alertlevel, materialcode, warehouse, shelf, date } = records;
        if (!stockid)
            throw new Error("stockid required");
        if (!category || typeof category !== "number" || !(category > 0))
            throw new Error("category must be a number greater than 0");
        const values = [consumptionunit, purchaseunit, alertlevel, materialcode, date, name, category, warehouse, shelf, stockid];
        const update = await (0, helper_1.promisifyQuery)(queries_1.UPDATEASTOCKQUERY, values);
        return (0, helper_1.rowAffected)(update);
    }
    async deleteAstock(stockid) {
        if (!stockid || typeof stockid !== "number")
            throw new Error("stockid required");
        return await (0, helper_1.promisifyQuery)(queries_1.DELETEASTOCKQUERY, [stockid]);
    }
    async getStocks(query, warehouseid) {
        let data = [];
        let newQuery = queries_1.GETGENERALSTOCK;
        if (warehouseid && warehouseid !== "all") {
            newQuery += ` WHERE ns.warehouse = ? LIMIT ? OFFSET ?`;
            data = await (0, helper_1.paginationQuery)(query, newQuery, [warehouseid]);
            return data;
        }
        newQuery += ` LIMIT ? OFFSET ?`;
        return await (0, helper_1.paginationQuery)(query, newQuery);
    }
    async getAstock(stockid) {
        if (!stockid)
            return;
        return await (0, helper_1.promisifyQuery)(`SELECT * FROM generalstocks WHERE stockid = ?`, [stockid]);
    }
    async getMainSupplyStock(stockid, brandid) {
        if (!brandid || !stockid)
            return new Error("stockid and brandid required");
        return await (0, helper_1.promisifyQuery)(`SELECT * FROM mainstoresupply WHERE stockid = ? AND brandid = ?`, [stockid, brandid]);
    }
    async getExpiredStock(query) {
        return await (0, helper_1.paginationQuery)(query, queries_1.EXPIREDSTOCKSQUERY);
    }
    async addStockCategory(records) {
        const { category } = records;
        if (!category || typeof category !== "string")
            throw new Error("Must be of type string and category required");
        const stockAvailable = await (0, helper_1.promisifyQuery)("SELECT * FROM stockcategory WHERE category = ?", [category]);
        if (stockAvailable.length > 0)
            return 1;
        const insertion = await (0, helper_1.promisifyQuery)("INSERT INTO stockcategory (category) VALUE (?)", [category]);
        return (0, helper_1.rowAffected)(insertion);
    }
    async getStockCategory() {
        return await (0, helper_1.promisifyQuery)(`SELECT * FROM stockcategory`);
    }
    async updateStockCategory(records) {
        const { id, category } = records;
        if (!id || !category)
            throw new Error("category and id required");
        const stockAvailable = await (0, helper_1.promisifyQuery)("SELECT * FROM stockcategory WHERE category = ?", [category]);
        if (stockAvailable.length === 0)
            return 1;
        const updateCat = await (0, helper_1.promisifyQuery)("UPDATE stockcategory SET category = ? WHERE id = ?", [category, parseInt(id)]);
        return (0, helper_1.rowAffected)(updateCat);
    }
    async deleteStockCategory(stockid) {
        if (!stockid)
            throw new Error("stockid required");
        const query = `DELETE FROM stockcategory WHERE id = ?`;
        const deletionResult = await (0, helper_1.promisifyQuery)(query, [stockid]);
        return (0, helper_1.rowAffected)(deletionResult);
    }
    async getGeneralUnExpiredStocks(requestQuery) {
        return await (0, helper_1.paginationQuery)(requestQuery, queries_1.GENERALUNEXPIREDSTOCKS);
    }
    async getGeneralExpired(query) {
        return await (0, helper_1.paginationQuery)(query, queries_1.EXPIREDSTOCKSQUERY);
    }
    async deleteStockBrand(records) {
        const { stockid, brandid } = records;
        if (!stockid || !brandid)
            return "stockid and brandid are required";
        const deleteResult = await (0, helper_1.promisifyQuery)(queries_1.DELETESTOCKABRANDQUERY, [stockid, brandid]);
        return (0, helper_1.rowAffected)(deleteResult);
    }
    async getAstockBrands(records) {
        const { count, page, stockid } = records;
        if (!stockid)
            throw new Error("stockid not provided");
        const result = await (0, helper_1.paginationQuery)({ count, page }, `SELECT * FROM stocksbrands WHERE stockid = ? LIMIT ? OFFSET ?`, [stockid]);
        return result;
    }
    async addStockBrand(records) {
        const { brand, stockid } = records;
        if (!brand || !stockid)
            throw new Error("brand name and stockid required");
        return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(`INSERT INTO stocksbrands (brand,stockid) VALUES (?,?)`, [brand, stockid]));
    }
    async updateAStockBrand(records) {
        const { brand, stockid, brandid } = records;
        if (!brand || !stockid || !brandid) {
            throw new Error("brand,brandid and stockid are all required");
        }
        const UPDATESTOCKBRANDQUERY = `UPDATE stocksbrands SET brand = ? WHERE stockid = ? AND brandid = ?`;
        const isUpdated = await (0, helper_1.promisifyQuery)(UPDATESTOCKBRANDQUERY, [brand, stockid, brandid]);
        return (0, helper_1.rowAffected)(isUpdated);
    }
    async filterstock(filteringValue, query) {
        let SQLQUERY = queries_1.FILTERSTOCKQUERY;
        if (!filteringValue)
            return [];
        let values = [filteringValue, filteringValue];
        const { warehouseid } = query;
        if (warehouseid && warehouseid !== "all") {
            SQLQUERY += ` AND gs.warehouse = ?`;
            values.push(warehouseid);
        }
        SQLQUERY += ` ORDER BY gs.name LIMIT ? OFFSET ?`;
        let data = await (0, helper_1.paginationQuery)(query, SQLQUERY, values);
        if (data.length === 0)
            return data;
        data = data.map((item, index) => {
            return Object.assign(Object.assign({}, item), { quantityrequired: 0 });
        });
        return data;
    }
    async updateStockOrders(data) {
        return (0, helper_1.promisifyQuery)(queries_1.updateStockOrderQuery, data);
    }
    async updateOrderReceivedTransactionSummary(summary) {
        const { orderTransactionid, method, amount, total } = summary;
        if (parseFloat(amount) < 0 || parseFloat(total) < 0 || !orderTransactionid)
            return false;
        const query = `UPDATE orderreceivedaccountsummary SET method  = ?,debit = ?, taxAmount = ?,updatedOn=NOW()  WHERE orderTransactionid = ?`;
        const values = [method, total, amount, orderTransactionid];
        return await (0, helper_1.promisifyQuery)(query, values);
    }
    async receivePurchaseStocks(records, total, tax, employeeid, response) {
        try {
            if (records.length === 0) {
                if (response) {
                    (0, helper_1.customError)("data must contain an array of products", 500, response);
                    return;
                }
                else {
                    throw new Error("data must be greater than 0");
                }
            }
            if (!tax || !Object.keys(tax).includes("amount") || !Object.keys(tax).includes("method")) {
                if (response) {
                    return (0, helper_1.customError)("Tax is an object with properties amount and method", 500, response);
                }
                else {
                    throw new Error("Tax is an object with properties amount and method");
                }
            }
            const { orderTransactionid } = records[0];
            const requiredDataSource = records.map((item, index) => {
                const { productordersid, received, quantityReceived, receiveddate, status, expirydate, batchnumber, balance, brandid, price, totalamount, stockid, } = item;
                return [
                    received,
                    quantityReceived,
                    receiveddate,
                    status,
                    expirydate,
                    batchnumber,
                    balance,
                    parseInt(brandid),
                    parseFloat(price),
                    parseFloat(totalamount),
                    productordersid,
                    orderTransactionid,
                    stockid,
                    employeeid,
                ];
            });
            let successCount = 0;
            let errorCount = 0;
            let current = 0;
            let ordersSummaryUpdated = false;
            while (current < records.length) {
                const data = Object.assign(Object.assign({}, requiredDataSource[current]), { employeeid });
                const updateRecord = await this.updateStockOrders(data);
                (0, helper_1.rowAffected)(updateRecord) ? successCount++ : errorCount++;
                current++;
            }
            if (successCount === records.length) {
                const summary = {
                    orderTransactionid,
                    total: parseFloat(total.toString()),
                    method: tax === null || tax === void 0 ? void 0 : tax.method,
                    amount: parseFloat(tax === null || tax === void 0 ? void 0 : tax.amount.toString()),
                };
                const updateSummary = await this.updateOrderReceivedTransactionSummary(summary);
                ordersSummaryUpdated = (0, helper_1.rowAffected)(updateSummary);
            }
            return !response
                ? ordersSummaryUpdated
                : response.send({ message: "order updated successfully", statusCode: 200, status: "success" });
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    async getDebitHxSingle(productordersid) {
        const DEBITHX = `SELECT * FROM  generalstoredebithx WHERE productordersid = ?`;
        const queryValues = [productordersid];
        return await (0, helper_1.promisifyQuery)(DEBITHX, queryValues);
    }
    async addDebitHx(productordersid, stockid, batchnumber, brandid, debitqty, wastage = 0) {
        if (!productordersid || !stockid || !batchnumber || !brandid) {
            throw new Error("brandid ,stockid ,batchnumber and productordersid are required");
        }
        const query = `INSERT INTO generalstoredebithx (productordersid,stockid,brandid,batchnumber,wastage,debitqty)
    VALUES(?,?,?,?,?,?)`;
        return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [productordersid, stockid, brandid, batchnumber, wastage, debitqty]));
    }
    async getCreditHxSingle(productordersid, stockid, brandid, batchnumber) {
        const CREDITHX = `SELECT * FROM  generalstorecredithx WHERE productordersid = ? AND 
    stockid = ? AND brandid = ? AND batchnumber = ?`;
        const queryValues = [productordersid, stockid, brandid, batchnumber];
        return await (0, helper_1.promisifyQuery)(CREDITHX, queryValues);
    }
    async isDebitable(stockid, brands) {
        if (!Array.isArray(brands) || brands.length === 0) {
            throw new TypeError("Array required and must not be empty");
        }
        const list = brands.join(",");
        const QUERY = queries_1.q_debiting_stock.replace("{list}", list);
        let data = await (0, helper_1.promisifyQuery)(QUERY, [stockid]);
        data = data
            .map((item, index) => {
            const storeQty = parseInt(item.credit) - parseInt(item.debitqty);
            return Object.assign(Object.assign({}, item), { storeQty });
        })
            .filter((a, b) => a["storeQty"] > 0);
        return data;
    }
    async purchasetoConsumeInsight(data) {
        const { stockid, records } = data;
        if (!stockid || !records)
            throw new Error("stockid and records are required");
        const getStockOrdersHx = await (0, helper_1.promisifyQuery)(queries_1.q_purchasetoConsumeInsight, [stockid, records]);
        let result = [];
        if (getStockOrdersHx.length > 0) {
            result = await Promise.all(getStockOrdersHx.map(async (transaction, i) => {
                const { batchnumber, brand, stockid, productordersid } = transaction;
                const getCreditHx = await this.getCreditHxSingle(productordersid, stockid, brand, batchnumber);
                const getDebitHx = await this.getDebitHxSingle(productordersid);
                transaction.credithistory = getCreditHx;
                transaction.debithistory = getDebitHx;
                return transaction;
            }));
        }
        return result;
    }
    async updateGeneralStocksQty(qty, stockid, operation = "minus") {
        if (!qty || !stockid)
            return new Error("qty and stockid are all required");
        if (qty < 0)
            return new Error("qty must be greater than 0");
        const stockinfo = await this.getAstock(stockid);
        if (stockinfo.length === 0)
            return 0; // Adjust return type based on your error handling strategy
        const quantity = parseInt(stockinfo[0]["quantity"]);
        const newQty = operation === "add" ? quantity + qty : quantity - qty;
        const update = await (0, helper_1.promisifyQuery)(`UPDATE generalstocks SET quantity = ? WHERE stockid = ?`, [newQty, stockid]);
        return (0, helper_1.rowAffected)(update);
    }
    async updateMainSupplyGeneral(stockid, brandid, qty, operation) {
        if (!stockid || !brandid || !qty) {
            throw new Error("stockid ,qty and brandid are required");
        }
        const info = await this.getMainSupplyStock(stockid, brandid);
        if (info.length === 0)
            return null;
        const infoqty = parseInt(info[0]["quantity"]);
        const newQty = operation === "add" ? infoqty + qty : infoqty - qty;
        const update = await (0, helper_1.promisifyQuery)(`UPDATE mainstoresupply SET quantity = ? WHERE stockid = ?
    AND brandid = ?`, [newQty, stockid, brandid]);
        return (0, helper_1.rowAffected)(update);
    }
}
module.exports = Inventory;
