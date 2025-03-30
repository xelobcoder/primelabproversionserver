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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderReceivedTransactionSummary = exports.addToStockTransactions = exports.updateOrders = exports.updateStock = exports.deleteAspecificOrder = exports.getunReceivedOrders = exports.placeOrder = exports.Orders = void 0;
const helper_1 = require("../../../helper");
const logger_1 = __importDefault(require("./../../../logger"));
const inventoryClass_1 = __importDefault(require("../../models/Inventory/inventoryClass/inventoryClass"));
const queries = __importStar(require("./queries"));
class Orders extends inventoryClass_1.default {
    constructor(stockid, orderid) {
        super(stockid);
        this.orderid = orderid;
    }
    async getOrdersTransactions(data, paginate = true) {
        let query = queries.q_get_all_orders_transactions;
        let conditions = [];
        let values = [];
        const { stockid, supplierid, from, end, page = 1, count = 10 } = data;
        if (stockid) {
            conditions.push(` stockid = ?`);
            values.push(stockid);
        }
        if (supplierid) {
            conditions.push(`supplierid = ?`);
            values.push(supplierid);
        }
        if (from && end) {
            conditions.push(` DATE(transactiondate) BETWEEN ? AND ?`);
            values.push(from);
            values.push(end);
        }
        if (conditions.length > 0) {
            let i = 0;
            while (i < conditions.length) {
                if (i == 0) {
                    query += ` WHERE ` + conditions[i];
                }
                else {
                    query += ` AND ` + conditions[i];
                }
                i++;
            }
        }
        query += ` GROUP BY orderTransactionid  ORDER BY ord.productordersid DESC`;
        if (paginate === true) {
            query += ` LIMIT ? OFFSET ?`;
            const packets = await (0, helper_1.paginationQuery)({ page, count }, query, values);
            return packets;
        }
        else {
            return await (0, helper_1.promisifyQuery)(query);
        }
    }
    async getOrdersTransactionItems(transactionid) {
        return await (0, helper_1.promisifyQuery)(queries.q_get_transaction_items, [transactionid]);
    }
    async getorderTransactionSummary(data, paginate = true) {
        let packets = await this.getOrdersTransactions(data, paginate);
        if (packets.length === 0)
            return [];
        let trimmedPackets = Promise.all(packets.map(async (item, index) => {
            const data = {
                requestedby: item.username,
                receivedby: item.receivedby,
                orderTransactionid: item.orderTransactionid,
                orderdate: item.transactiondate,
            };
            if (data.receivedby != null) {
                let receivedby = await (0, helper_1.promisifyQuery)(`SELECT username FROM roles WHERE employeeid = ?`, [item.receivedby]);
                if (receivedby.length > 0) {
                    data.receivedby = receivedby[0]["username"];
                }
            }
            return data;
        }));
        return trimmedPackets;
    }
}
exports.Orders = Orders;
const placeOrder = async function (request, response) {
    let successCount = 0;
    let errorCount = 0;
    let Exit = [];
    const addNewOrder = async (orderTransactionid, item, employeeid) => {
        const { quantity, stockid, name, suppliername, supplierid, purchaseunit } = item;
        return (0, helper_1.promisifyQuery)(queries.q_addNewOrder, [
            quantity,
            stockid,
            name,
            suppliername,
            supplierid,
            purchaseunit,
            orderTransactionid,
            employeeid,
        ]);
    };
    const checkOrderExist = async (item) => {
        const { supplierid, stockid } = item;
        return (0, helper_1.promisifyQuery)(queries.q_checkOrderExist, [stockid, "FALSE", supplierid]);
    };
    const { stock, employeeid } = request.body;
    const orderTransactionid = Date.now();
    if (Array.isArray(stock) && stock.length > 0) {
        let counter = 0;
        stock.forEach(async (item, index) => {
            var _a;
            try {
                let present = await checkOrderExist(item);
                let count = (_a = present[0]) === null || _a === void 0 ? void 0 : _a.count;
                if (present && count > 0) {
                    Exit.push(item);
                }
                else {
                    let added = await addNewOrder(orderTransactionid, item, employeeid);
                    const affectedRows = added === null || added === void 0 ? void 0 : added.affectedRows;
                    if (affectedRows === 1)
                        successCount++;
                }
            }
            catch (err) {
                logger_1.default.error(err);
                errorCount++;
            }
            counter++;
            if (counter === stock.length) {
                let responseString = ``;
                Exit.forEach((item, index) => {
                    const { suppliername, name, stockid } = item;
                    responseString += `${name} with stockid ${stockid} request to ${suppliername} was earlier on requested but remained unresolved, hence not added,`;
                });
                response.send({
                    statusCode: 200,
                    status: "success",
                    clear: Exit.length,
                    message: `${successCount} items successfully requested. ${errorCount} error occurred. ${responseString}`,
                });
            }
        });
    }
};
exports.placeOrder = placeOrder;
const getunReceivedOrders = async function (data) {
    const { orderTransactionid, includebrands, page, count } = data;
    const queryValues = [];
    let query = queries.q_getOrders;
    if (orderTransactionid) {
        query += ` AND orderTransactionid = ?`;
        queryValues.push(orderTransactionid);
    }
    query += ` ORDER BY productordersid DESC LIMIT ? OFFSET ?`;
    try {
        let result = {};
        result.products = await (0, helper_1.paginationQuery)({ count, page }, query, queryValues);
        if (includebrands) {
            const getbrands = result.products.map((item, index) => item.stockid);
            if (getbrands.length > 0) {
                const stocksBrands = await (0, helper_1.promisifyQuery)(queries.q_getStockBrands, [getbrands]);
                result.stockBrands = stocksBrands;
            }
            else {
                result.stockBrands = [];
            }
        }
        return result;
    }
    catch (err) {
        throw new Error(err);
    }
};
exports.getunReceivedOrders = getunReceivedOrders;
const deleteAspecificOrder = async function (orderid, response) {
    const query = queries.q_deleteOrder;
    return await (0, helper_1.rowAffected)((0, helper_1.promisifyQuery)(query, [orderid]));
};
exports.deleteAspecificOrder = deleteAspecificOrder;
const updateStock = async function (stockid, planned, request, response) {
    const query = queries.q_updateStock;
    const result = await (0, helper_1.promisifyQuery)(query, [stockid]);
    if (exports.updateStock) {
        const { stockid, quantity } = result[0];
        const updatedQuantity = parseInt(quantity) + planned;
        const is_updated = await (0, helper_1.promisifyQuery)(queries.q_updateGeneralStocks, [updatedQuantity, stockid]);
        return (0, helper_1.rowAffected)(is_updated);
    }
};
exports.updateStock = updateStock;
const updateOrders = function (data) {
    const query = queries.q_updateOrders;
    return (0, helper_1.promisifyQuery)(query, data);
};
exports.updateOrders = updateOrders;
const addToStockTransactions = async function (data) {
    if (Array.isArray(data) && data.length > 0) {
        await (0, helper_1.promisifyQuery)(queries);
        console.log("Stock transaction added successfully");
    }
};
exports.addToStockTransactions = addToStockTransactions;
const updateOrderReceivedTransactionSummary = async function (summary) {
    const { orderTransactionid, method, amount, total } = summary;
    if (parseFloat(amount) < 0 || parseFloat(total) < 0 || !orderTransactionid)
        return false;
    const query = queries.q_updateOrderReceivedTransactionSummary;
    const values = [method, total, amount, orderTransactionid];
    (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, values));
};
exports.updateOrderReceivedTransactionSummary = updateOrderReceivedTransactionSummary;
