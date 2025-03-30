"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingInvoiceData = void 0;
const handlers_1 = require("./handlers");
const helper_1 = require("../../../helper");
async function getBillingInvoiceData(billingid, response) {
    if (billingid) {
        const Invoice = {};
        try {
            Invoice.testInformation = await (0, handlers_1.testInformation)(billingid);
            Invoice.clientInformation = await (0, handlers_1.clientInformation)(billingid);
            const resultset = {
                testInformation: Invoice.testInformation.length > 0 ? Invoice.testInformation.map((item) => (0, helper_1.convertKeysToLowerCase)(item)) : [],
                clientInformation: Invoice.clientInformation.length > 0 ? (0, helper_1.convertKeysToLowerCase)(Invoice.clientInformation[0]) : {},
            };
            if (response) {
                response.send({
                    result: resultset,
                    message: "success",
                    statusCode: 200,
                });
            }
            else {
                return resultset;
            }
        }
        catch (err) {
            if (response) {
                (0, helper_1.customError)(err.message || err, 500, response);
            }
            else {
                throw err;
            }
        }
    }
    else {
        if (response) {
            (0, helper_1.customError)("billingid required in query", 401, response);
        }
        else {
            throw new Error("billingid required in query");
        }
    }
}
exports.getBillingInvoiceData = getBillingInvoiceData;
