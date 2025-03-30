"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReceiveOrders = exports.addCommodity = exports.updateSupplier = exports.deleteSupplier = exports.addSupplier = exports.getSupplierById = exports.getSupplierStatusUnfulfilled = exports.getSuppliers = void 0;
const supplierClass_1 = __importDefault(require("../../models/supply/supplierClass"));
const helper_1 = require("../../../helper");
const logger_1 = require("../../../logger");
const inventoryClass_1 = __importDefault(require("../../models/Inventory/inventoryClass/inventoryClass"));
const getSuppliers = async (request, response) => {
    try {
        const { supplierid } = request.query;
        let result = [];
        if (supplierid) {
            result = await new supplierClass_1.default().getSupplier(parseInt(supplierid));
        }
        else {
            result = await new supplierClass_1.default().getSuppliers(request.query);
        }
        response.send({ result, statusCode: 200, status: "success" });
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, response);
        logger_1.logger.err(err);
    }
};
exports.getSuppliers = getSuppliers;
const getSupplierStatusUnfulfilled = async (request, response) => {
    const { supplierid, status } = request.query;
    if (!supplierid) {
        return (0, helper_1.customError)("supplierid not provided", 404, response);
    }
    const result = await new supplierClass_1.default().getSupplierPendingOrders(parseInt(supplierid), status);
    response.send(result);
};
exports.getSupplierStatusUnfulfilled = getSupplierStatusUnfulfilled;
const getSupplierById = async (request, response) => {
    try {
        const { supplierid } = request.query;
        if (!supplierid)
            return (0, helper_1.customError)(`supplier id not included in request`, 404, response);
        const result = await new supplierClass_1.default().getSupplier(parseInt(supplierid));
        response.send({ result, statusCode: 200, status: "success" });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getSupplierById = getSupplierById;
const addSupplier = async (request, response) => {
    try {
        const result = await new supplierClass_1.default().addSupplier(request.body);
        response.send(result);
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, response);
    }
};
exports.addSupplier = addSupplier;
const deleteSupplier = async (request, response) => {
    try {
        const { supplierid } = request.query;
        if (!supplierid) {
            return (0, helper_1.customError)("supplierid must be provided", 404, response);
        }
        const isdeleted = await new supplierClass_1.default().deleteSupplier(parseInt(supplierid));
        response.send({ statusCode: 200, status: "success", message: isdeleted ? "deleted successfully" : "deleting supplier failed" });
    }
    catch (err) {
        (0, helper_1.customError)("something went wrong", 500, response);
    }
};
exports.deleteSupplier = deleteSupplier;
const updateSupplier = async (request, response) => {
    try {
        const isUpdated = await new supplierClass_1.default().updateSupplier(request.body);
        if (isUpdated === false) {
            (0, helper_1.customError)("supplier id not provided", 404, response);
            return;
        }
        response.send({
            message: isUpdated != null ? "Supplier information updated successfully" : "Failure in updating supplier",
            statusCode: 200,
            status: isUpdated != null ? "success" : "error",
        });
    }
    catch (err) {
        (0, helper_1.customError)("something wrong occured", 500, response);
    }
};
exports.updateSupplier = updateSupplier;
const addCommodity = async (request, response) => {
    try {
        const added = await new supplierClass_1.default().postCommodity(request.body);
        response.send({
            message: added != null ? "new commodity added successfully " : "Failure in adding category",
            statusCode: 200,
            status: added != null ? "success" : "error",
        });
    }
    catch (err) {
        (0, helper_1.customError)(err || "something went wrong", err === "name and category required" ? 404 : 500, response);
    }
};
exports.addCommodity = addCommodity;
async function handleReceiveOrders(request, response) {
    try {
        const { data, tax, totalprice, employeeid } = request.body;
        const result = await new inventoryClass_1.default(null).receivePurchaseStocks(data, totalprice, tax, employeeid);
        return result
            ? response.send({ message: "order updated successfully", statusCode: 200, status: "success" })
            : response.send({ message: "order update failed", statusCode: 200, status: "success" });
    }
    catch (err) {
        (0, helper_1.customError)("something wrong occured", 500, response);
    }
}
exports.handleReceiveOrders = handleReceiveOrders;
