"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBilledClients = exports.canInitiateBill = exports.handleNewBilling = void 0;
const helper_1 = require("../../../helper");
const billing_1 = require("../../models/billing/billing");
const billingclientTypes_1 = require("../../models/billing/billingclientTypes");
const trycatch_1 = require("../../models/generics/trycatch");
async function handleNewBilling(request, response) {
    async function validate() {
        const { patientid } = request.body;
        let bill = await new billing_1.Billing(patientid).insertionProcess(request.body, true);
        if (typeof bill == "string" && bill == billingclientTypes_1.billErrors.already) {
            return response.send({ message: bill, statusCode: 200, status: "success" });
        }
        else if (typeof bill == "boolean" && bill) {
            return response.status(200).json({
                message: "billing successfully",
                statusCode: 200,
                status: "success",
            });
        }
        else {
            return (0, helper_1.customError)(billingclientTypes_1.billErrors.error, 400, response);
        }
    }
    (0, trycatch_1.wrapperTryCatch)(validate, (err) => console.log(err));
}
exports.handleNewBilling = handleNewBilling;
async function canInitiateBill(request, response) {
    let { patientid } = request.query;
    if (!patientid) {
        return (0, helper_1.customError)(`Bad Request. patientid required`, 404, response);
    }
    let ptid;
    if (typeof patientid === "string") {
        ptid = parseInt(patientid);
    }
    if (isNaN(ptid)) {
        (0, helper_1.customError)("Bad Request.patientid must a number", 400, response);
    }
    const canBill = await new billing_1.Billing(ptid).haveBeenBilledToday(ptid);
    response.send({ canInitiateBill: canBill });
}
exports.canInitiateBill = canInitiateBill;
async function getBilledClients(request, response) {
}
exports.getBilledClients = getBilledClients;
// app.get("/api/v1/billedclients", (req, res) => {
//   getBilledClients(req, res)
// })
