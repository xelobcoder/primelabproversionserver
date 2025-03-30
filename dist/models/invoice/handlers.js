"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientInformation = exports.testInformation = void 0;
const helper_1 = require("../../../helper");
const logger_1 = __importDefault(require("../../../logger"));
const queries_1 = require("./queries");
const testInformation = async (billingid) => {
    try {
        return await (0, helper_1.promisifyQuery)(queries_1.testInformationQuery, [billingid]);
    }
    catch (err) {
        logger_1.default.error(err);
        throw new Error(err);
    }
};
exports.testInformation = testInformation;
const clientInformation = async (billingid) => {
    try {
        return await (0, helper_1.promisifyQuery)(queries_1.clientInformationQuery, [billingid]);
    }
    catch (err) {
        logger_1.default.error(err);
        throw new Error(err);
    }
};
exports.clientInformation = clientInformation;
