"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Billing = void 0;
const billingclientTypes_1 = require("./billingclientTypes");
const helper_js_1 = require("./../../../helper.js");
const queries_1 = require("./queries");
/**
 * Represents a billing manager for handling billing operations.
 */
class Billing {
    /**
     * Creates an instance of the Billing class.
     * @param patientid The ID of the patient.
     */
    constructor(patientid) {
        this.patientid = patientid;
    }
    /**
     * Retrieves transaction billing data for a specific billing ID.
     * @param billingid The ID of the billing transaction.
     * @returns A promise that resolves to an array of transaction data.
     */
    async getTransactionBillData(billingid) {
        return await (0, helper_js_1.promisifyQuery)(`SELECT * FROM billing WHERE billingid  =? `, [billingid]);
    }
    /**
     * Retrieves the clients billed today for a specific branch.
     * @param branchid The ID of the branch.
     * @param pagination The pagination options including count and page.
     * @returns A promise that resolves to an array of billed clients.
     */
    async getBranchDayBilledClients(branchid, { count = 10, page = 1 }) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        const result = await (0, helper_js_1.promisifyQuery)(queries_1.currentDateBilledClients, [currentYear, month, day, branchid]);
        return result;
    }
    /**
     * Wrapper method to execute a callback with try/catch error handling.
     * @param cb The callback to execute.
     * @param errcb The error callback to execute in case of an error.
     * @returns The result of the callback or null in case of an error.
     */
    wrapperTryCatch(cb, errcb) {
        try {
            return cb();
        }
        catch (err) {
            if (errcb && typeof errcb == "function") {
                errcb(err);
            }
            else {
                console.error("Error uncaught and unhandled", err);
            }
        }
    }
    /**
     * Inserts a new billing record.
     */
    async insertNewBilling() { }
    /**
     * Bills a client based on the provided billing data.
     * @param data The billing data.
     * @returns A promise that resolves to the insert ID or false in case of an error.
     */
    async billClient(data) {
        try {
            const { patientid, clinician = 0, organization = 0, paid, payable, outstanding, discount, samplingCenter, taxIncluded, taxValue, status, testcost, employeeid, type, } = data;
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const partitionName = `billing_${year}_${month}`;
            const values = [
                patientid,
                clinician,
                organization,
                paid,
                payable,
                type,
                outstanding,
                discount,
                samplingCenter,
                taxIncluded,
                taxValue,
                status,
                testcost,
                employeeid,
            ];
            const { affectedRows, insertId } = await (0, helper_js_1.promisifyQuery)(queries_1.insertBillQuery, values);
            if (affectedRows == 0)
                return false;
            return insertId;
        }
        catch (err) {
            throw new Error(billingclientTypes_1.billErrors.error);
        }
    }
    /**
     * Checks if the complete flow of the laboratory flow is activated like from registration to phelobotomy to sample validation, processing and result entry.
     * @returns A promise that resolves to a boolean indicating if the complete flow is enabled.
     */
    async isCompleteFlow() {
        const settings = await (0, helper_js_1.promisifyQuery)(`SELECT * FROM applicationsettings`);
        if (settings.length == 0)
            return false;
        return settings[0]["completeFlow"] == 1 ? true : false;
    }
    /**
     * Updates the billing history for a specific billing ID.
     * @param paymentmode The payment mode.
     * @param billingid The billing ID.
     * @param amount The amount to update.
     * @returns A promise that resolves to the result of the update query.
     */
    async updateBillingHistory(paymentmode, billingid, amount) {
        const values = [paymentmode, amount, billingid];
        return await (0, helper_js_1.promisifyQuery)(queries_1.updatebillHistoryQuery, values);
    }
    /**
     * Updates the approval status for a specific billing and test ID.
     * @param billingid The billing ID.
     * @param testid The test ID.
     * @returns A promise that resolves to the result of the update query.
     */
    async updateApprovalStatus(billingid, testid) {
        try {
            const query = `UPDATE samplestatus SET approvalstatus = 1 WHERE billingid = ? AND testid = ?`;
            const values = [billingid, testid];
            return (0, helper_js_1.promisifyQuery)(query, values);
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Deletes an ascension ID for a specific billing and test ID.
     * @param billingid The billing ID.
     * @param testid The test ID.
     * @returns A promise that resolves to a boolean indicating if the row was affected.
     */
    async deleteAscensionid(billingid, testid) {
        const result = await (0, helper_js_1.promisifyQuery)(queries_1.deleteAscensionidQuery, [billingid, testid]);
        return (0, helper_js_1.rowAffected)(result);
    }
    /**
     * Checks if a patient has been billed today.
     * @param patientid The patient ID.
     * @returns A promise that resolves to a boolean indicating if the patient has been billed today.
     */
    async haveBeenBilledToday(patientid) {
        const result = await (0, helper_js_1.promisifyQuery)(queries_1.patientBilledTodayQuery, patientid);
        return !(result[0]["count"] > 0);
    }
    /**
     * Deletes entries with errors based on the inserted test IDs.
     * @param inserted The array of inserted test IDs.
     * @param billingid The billing ID.
     */
    async deleteAddedWithError(inserted, billingid) {
        let counter = 0;
        while (inserted.length > 0 && counter <= inserted.length) {
            const isDeleted = (0, helper_js_1.rowAffected)(await this.deleteAscensionid(billingid, inserted[counter]));
            if (isDeleted) {
                inserted = inserted.filter((a) => a != inserted[counter]);
            }
            counter++;
        }
    }
    /**
     * Adds tests to ascension for a specific billing ID.
     * @param data The ascension parameters.
     * @returns A promise that resolves to a boolean indicating if all tests were added successfully.
     */
    async AddtoTestAscenstion(data) {
        const { billingid, testidCollection } = data;
        let insertionCount = 0;
        const inserted = [];
        try {
            if (testidCollection.length == 0)
                throw new Error("Bad Parameters, testCollection not added");
            const fullFlow = await this.isCompleteFlow();
            for (let i = 0; i < testidCollection.length; i++) {
                const testid = testidCollection[i];
                const isInserted = await (0, helper_js_1.promisifyQuery)(queries_1.AddtoTestAscenstionQuery, [testid, billingid, fullFlow ? "false" : "true"]);
                if (!isInserted)
                    throw new Error(billingclientTypes_1.billErrors.failed);
                insertionCount++;
                inserted.push(testid);
                if (!fullFlow) {
                    await this.updateApprovalStatus(billingid, testid);
                }
            }
            return insertionCount === testidCollection.length;
        }
        catch (err) {
            await this.deleteAddedWithError(inserted, billingid);
            throw new Error((err === null || err === void 0 ? void 0 : err.message) || err);
        }
    }
    /**
     * Deletes a billing transaction for a specific billing ID.
     * @param billingid The billing ID.
     * @returns A promise that resolves to the result of the delete query.
     */
    async deleteBillTransaction(billingid) {
        return await (0, helper_js_1.promisifyQuery)(queries_1.deleteBillTransactionQuery, [billingid]);
    }
    /**
     * Cleans up recorded payment history for a specific billing ID.
     * @param billingid The billing ID.
     */
    async cleanUpRecordedPaymentHx(billingid) {
        await (0, helper_js_1.promisifyQuery)(queries_1.deleteNewBillPaymentHx, billingid);
    }
    /**
     * Handles the insertion process for billing data.
     * @param billingData The billing data.
     * @param strict Indicates if strict checking should be done.
     * @returns A promise that resolves to a boolean or string indicating the result of the insertion process.
     */
    async insertionProcess(billingData, strict = true) {
        let isHistoryAdded = false;
        let isAscAdded = false;
        let billingid = undefined;
        try {
            let canInitiateNewBill = true;
            if (strict) {
                canInitiateNewBill = await this.haveBeenBilledToday(this.patientid);
            }
            if (!canInitiateNewBill) {
                return billingclientTypes_1.billErrors.already;
            }
            billingid = await this.billClient(billingData);
            if (typeof billingid == "boolean" || !billingid)
                return billingclientTypes_1.billErrors.failed;
            isAscAdded = await this.AddtoTestAscenstion({ billingid, testidCollection: billingData.test });
            isHistoryAdded = (0, helper_js_1.rowAffected)(await this.updateBillingHistory(billingData.paymentmode, billingid, billingData.paid));
            if (isAscAdded && isHistoryAdded && billingid) {
                return true;
            }
            await this.deleteBillTransaction(billingid);
            return billingclientTypes_1.billErrors.failed;
        }
        catch (err) {
            if (billingid) {
                await this.deleteBillTransaction(billingid);
            }
            return billingclientTypes_1.billErrors.error;
        }
    }
}
exports.Billing = Billing;
