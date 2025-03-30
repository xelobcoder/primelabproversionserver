"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_1 = require("../../../helper");
const logger_1 = __importDefault(require("../../../logger"));
class Payment {
    constructor(patientid) {
        this.getClientTransactionInformation = async (records) => {
            try {
                const { patientid, from, to, count = 10, page = 1 } = records;
                const values = [];
                let modelQuery = queries_1.queries.getClientTransactionInformation;
                if (patientid) {
                    modelQuery += ` WHERE np.PATIENTID = ?`;
                    values.push(parseInt(patientid.toString()));
                }
                if (from && patientid) {
                    values.push(from);
                    if (to) {
                        modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND ?`;
                        values.push(to);
                    }
                    else {
                        modelQuery += ` AND DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
                    }
                }
                else if (!patientid && from) {
                    values.push(from);
                    if (!to) {
                        modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
                    }
                    else {
                        modelQuery += ` WHERE DATE(b.billedon) BETWEEN ? AND ?`;
                        values.push(to);
                    }
                }
                modelQuery += from || patientid ? ` ORDER BY b.billingid ASC LIMIT ? OFFSET ? ` : ` ORDER BY b.billingid DESC LIMIT ? OFFSET ? `;
                const result = await (0, helper_1.paginationQuery)({ count, page }, modelQuery, values);
                return result;
            }
            catch (err) {
                logger_1.default.error(err);
                throw new Error(err);
            }
        };
        this.getClientFullOutstanding = async (patientid, billingid) => {
            if (!billingid || !patientid) {
                throw new Error("patientid and billingid are required");
            }
            const modelQuery = queries_1.queries.getClientFullOutstanding;
            const result = await (0, helper_1.promisifyQuery)(modelQuery, [patientid]);
            if (result.length > 0) {
                const { total, paid } = result[0];
                return total - paid;
            }
            return 0;
        };
        this.getTransactionData = async (patientid) => {
            if (!patientid) {
                throw new Error("patientid not included");
            }
            const modelQuery = queries_1.queries.getTransactionData;
            return (0, helper_1.promisifyQuery)(modelQuery, [patientid]);
        };
        this.allClientDebtTransactions = async (patientid) => {
            if (!patientid) {
                throw new Error("patientid is required");
            }
            const modelQuery = queries_1.queries.allClientDebtTransactions;
            return (0, helper_1.promisifyQuery)(modelQuery, [patientid]);
        };
        this.updateSingleTransactionDebt = async (billingid, paid, outstanding) => {
            const model = queries_1.queries.updateSingleTransactionDebt;
            try {
                return (0, helper_1.promisifyQuery)(model, [paid, outstanding, billingid]);
            }
            catch (err) {
                return err;
            }
        };
        this.updateTransactionHx = async (billingid, payment, amount, employeeid) => {
            const model = queries_1.queries.updateTransactionHx;
            return (0, helper_1.promisifyQuery)(model, [billingid, payment, amount, employeeid]);
        };
        this.clearClientDebtBulk = async (patientid, amount, pymode, employeeid) => {
            try {
                if (!patientid) {
                    throw new Error("patientid is required");
                }
                const debts = await this.allClientDebtTransactions(patientid);
                if (debts.length === 0) {
                    return "No debts found for the patient";
                }
                const totalDebt = debts.reduce((total, item) => total + item.outstanding, 0);
                if (totalDebt === amount) {
                    const result = await Promise.all(debts.map(async (item) => {
                        const { outstanding, payable, billingid } = item;
                        const dd = (0, helper_1.rowAffected)(await this.updateSingleTransactionDebt(billingid, payable, 0));
                        const tt = (0, helper_1.rowAffected)(await this.updateTransactionHx(billingid, pymode, outstanding, employeeid));
                        return dd && tt;
                    }));
                    return !result.some((a) => !a);
                }
                let balance = amount;
                for (const item of debts) {
                    if (balance <= 0)
                        break;
                    const { outstanding, paid, payable, discount, billingid } = item;
                    if (outstanding > balance) {
                        const paidAmount = parseFloat(paid) + balance;
                        const newOutstanding = parseFloat(payable) - (parseFloat(discount) + parseFloat(paid) + parseFloat(balance));
                        await this.updateSingleTransactionDebt(billingid, paidAmount, newOutstanding);
                        await this.updateTransactionHx(billingid, pymode, balance, employeeid);
                        balance = 0;
                    }
                    else {
                        await this.updateSingleTransactionDebt(billingid, payable, 0);
                        await this.updateTransactionHx(billingid, pymode, outstanding, employeeid);
                        balance -= outstanding;
                    }
                }
                return true;
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.updatePayment = async (request, response) => {
            try {
                const { billingid, pay, paymentMode } = request.body;
                const result = await (0, helper_1.promisifyQuery)(queries_1.queries.updatePayment, [billingid]);
                if (result.length === 0) {
                    throw new Error("No such transaction found");
                }
                const { paid_amount, discount, outstanding, payable } = result[0];
                if (outstanding <= 0) {
                    response.send({ status: "success", statusCode: 200, message: "Client is in good standing" });
                    return;
                }
                const newAmount = paid_amount + parseInt(pay);
                const notOutstanding = payable - newAmount - discount;
                const updateQuery = queries_1.queries.updatePaymentUpdate;
                const values = [notOutstanding, newAmount, billingid];
                const updateInfo = await (0, helper_1.promisifyQuery)(updateQuery, values);
                if (!(0, helper_1.rowAffected)(updateInfo)) {
                    throw new Error("Failed to update payment");
                }
                const inserted = await (0, helper_1.promisifyQuery)(queries_1.queries.insertBillingHx, [billingid, paymentMode, pay]);
                if (!(0, helper_1.rowAffected)(inserted)) {
                    throw new Error("Failed to insert payment history");
                }
                response.send({ message: "Payment updated successfully", statusCode: 200, status: "success" });
            }
            catch (err) {
                (0, helper_1.customError)(err.message || "Something went wrong", 500, response);
            }
        };
        this.paymentMode = async (request, response) => {
            try {
                const result = await (0, helper_1.promisifyQuery)(queries_1.queries.paymentMode);
                response.send({ data: result || [], status: "success", statusCode: 200 });
            }
            catch (err) {
                (0, helper_1.customError)("Something went wrong", 500, response);
            }
        };
        this.specificBillTransactionHx = async (request, response) => {
            try {
                const { billingid } = request.query;
                if (!billingid) {
                    (0, helper_1.customError)("billingid is required as a query parameter", 401, response);
                    return;
                }
                const result = await (0, helper_1.promisifyQuery)(queries_1.queries.specificBillTransactionHx, [billingid]);
                response.send(result);
            }
            catch (err) {
                (0, helper_1.customError)("Something went wrong", 500, response);
            }
        };
        this.patientid = patientid;
    }
}
exports.default = Payment;
