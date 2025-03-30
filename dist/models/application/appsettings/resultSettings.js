"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appset_1 = __importDefault(require("../appsettings/appset")); // Assuming ApplicationSettings is a class
const helper_1 = require("../../../../helper");
const queries_1 = require("./queries");
class ResultSettings extends appset_1.default {
    constructor(id) {
        super();
    }
    async getResultSettings(request, response) {
        try {
            let result = await (0, helper_1.promisifyQuery)(queries_1.GET_RESULT_SETTINGS);
            if (result.length !== 0) {
                result = result[0]["resultsettings"];
                response.send(result);
            }
            else {
                response.send({});
            }
        }
        catch (err) {
            (0, helper_1.responseError)(response);
        }
    }
    async updateResultSettings(request, response) {
        try {
            const { data } = request.body;
            if (!data) {
                return (0, helper_1.responseError)(response, "data object required", 404);
            }
            if (Object.keys(data).length === 0) {
                return (0, helper_1.responseError)(response, "type object with key values required", 404);
            }
            const jsonify = JSON.stringify(data);
            let result = await (0, helper_1.promisifyQuery)(queries_1.GET_RESULT_SETTINGS);
            if (result.length === 0) {
                const insert = await (0, helper_1.promisifyQuery)(queries_1.INSERT_RESULT_SETTINGS, [jsonify]);
                if ((0, helper_1.rowAffected)(insert)) {
                    response.send({ status: "success", message: "update successful" });
                }
                else {
                    response.send({ status: "error", message: "update failed" });
                }
            }
            else {
                const update = await (0, helper_1.promisifyQuery)(queries_1.UPDATE_RESULT_SETTINGS, [jsonify]);
                if ((0, helper_1.rowAffected)(update)) {
                    response.send({ status: "success", message: "update successful" });
                }
                else {
                    response.send({ status: "error", message: "update failed" });
                }
            }
        }
        catch (err) {
            console.error(err);
            (0, helper_1.responseError)(response);
        }
    }
}
exports.default = ResultSettings;
