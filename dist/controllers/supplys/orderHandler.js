"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTransactionsOrders = exports.handleDeleteAspecificOrder = exports.handleGetOrders = exports.handlePlaceOrder = void 0;
const orders_1 = require("../../models/orders/orders");
const helper_1 = require("../../../helper");
const handlePlaceOrder = (request, response) => {
    (0, orders_1.placeOrder)(request, response);
};
exports.handlePlaceOrder = handlePlaceOrder;
const handleGetOrders = async (request, response) => {
    try {
        const { status, orderTransactionid } = request.query;
        if (status === "pending") {
            const orders = await (0, orders_1.getunReceivedOrders)(request.query);
            response.send({ result: orders, status: "success", statusCode: 200 });
        }
        else {
            const orders = await new orders_1.Orders().getOrdersTransactionItems(orderTransactionid);
            response.send({ result: { products: orders }, status: "success", statusCode: 200 });
        }
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.handleGetOrders = handleGetOrders;
const handleDeleteAspecificOrder = async (request, response) => {
    try {
        const { productordersid } = request.body;
        const isDeleted = await (0, orders_1.deleteAspecificOrder)(productordersid, response);
        return isDeleted
            ? response.send({
                status: "success",
                message: "Order deleted successfully",
                statusCode: 200,
            })
            : response.send({
                status: "success",
                message: "Order delete operation failed",
                statusCode: 200,
            });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.handleDeleteAspecificOrder = handleDeleteAspecificOrder;
async function handleTransactionsOrders(request, response) {
    try {
        const result = await new orders_1.Orders().getorderTransactionSummary(request.query, true);
        response.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
}
exports.handleTransactionsOrders = handleTransactionsOrders;
