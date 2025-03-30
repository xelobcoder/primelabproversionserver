"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const logger_1 = __importDefault(require("../../../logger"));
const appset_1 = __importDefault(require("./appsettings/appset"));
const TQueries_1 = require("./TQueries");
class Tax extends appset_1.default {
    constructor(id) {
        super();
    }
    async addTax(request, response) {
        const { value, name } = request.body;
        if (!name || !value)
            return (0, helper_1.customError)("name and value required", 401, response);
        try {
            const existCount = await (0, helper_1.promisifyQuery)(TQueries_1.checkTaxNameExistQuery, name);
            if (Array.isArray(existCount) && existCount.length > 0) {
                response.send({
                    message: "tax with such name available",
                    status: "success",
                    statusCode: 406,
                });
            }
            else {
                const result = await (0, helper_1.promisifyQuery)(TQueries_1.addTaxQuery, [name, value]);
                response.send({
                    message: (0, helper_1.rowAffected)(result) ? "tax added successfully" : "Error inserting new tax",
                    status: "success",
                    statusCode: 200,
                });
            }
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("error occurred", 500, response);
        }
    }
    async getTax(request, response) {
        try {
            const result = await (0, helper_1.promisifyQuery)(TQueries_1.getAllTaxesQuery);
            response.send({ status: "success", statusCode: 200, result });
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)(err === null || err === void 0 ? void 0 : err.message, 500, response);
        }
    }
    async updateTax(request, response) {
        const { id, value, name } = request.body;
        if (!id || !value || !name)
            return (0, helper_1.customError)("tax id, name and value are required", 404, response);
        try {
            const result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(TQueries_1.updateTaxQuery, [name, value, id]));
            response.send({
                message: result ? "updated successfully" : "failed updating",
                status: result ? "success" : "failed",
            });
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("error occurred", 500, response);
        }
    }
    async changeTaxStatus(request, response) {
        const { id, status } = request.body;
        if (!id || typeof status !== "boolean")
            return (0, helper_1.customError)("tax id and applystatus required", 404, response);
        const value = status ? "Yes" : "No";
        try {
            const result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(TQueries_1.changeTaxStatusQuery, [value, id]));
            response.send({
                message: result ? "updated successfully" : "update failed",
                status: result ? "success" : "failed",
            });
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("error occurred", 500, response);
        }
    }
    async deleteTax(request, response) {
        const { id } = request.query;
        if (!id)
            return (0, helper_1.customError)("tax id required", 404, response);
        try {
            const result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(TQueries_1.deleteTaxQuery, [id]));
            response.send({
                message: result ? "delete successful" : "delete failed",
                status: result ? "success" : "failed",
            });
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("error occurred", 500, response);
        }
    }
}
exports.default = Tax;
