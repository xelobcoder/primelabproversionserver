"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const { promisifyQuery, rowAffected } = require("../../../../helper");
// const {EmailService} = require("../../")
class ApplicationSettings {
    async getAllAppSettings() {
        return promisifyQuery(queries_1.q_application_setting);
    }
    async getAppBillSettings() {
        const settings = await this.getAllAppSettings();
        if (settings.length === 0)
            return false;
        const { includeTax, PaidBillsBeforeTransaction } = settings[0];
        if (includeTax === 0) {
            return { includeTax, taxValue: 0, PaidBillsBeforeTransaction };
        }
        const getTax = await promisifyQuery(queries_1.q_active_tax);
        if (getTax.length == 0) {
            return { includeTax, taxValue: 0, PaidBillsBeforeTransaction };
        }
        else {
            const taxValue = getTax.reduce((a, b) => {
                return a + b.value;
            }, 0);
            return {
                includeTax,
                taxValue: taxValue,
                PaidBillsBeforeTransaction,
            };
        }
    }
    async getEmailPreference() {
        let data = await promisifyQuery(queries_1.q_get_email_pref);
        return data.length > 0 ? data[0] : [];
    }
    async shouldSendRejectionEmail() {
        const settings = await this.getAllAppSettings();
        let isServicesActivated = false;
        let isRejectedPrefered = false;
        if (settings.length > 0 && settings[0]["emailNotification"] == 1) {
            isServicesActivated = true;
        }
        const rejectionPreference = await this.getEmailPreference();
        if (!Array.isArray(rejectionPreference) && (rejectionPreference === null || rejectionPreference === void 0 ? void 0 : rejectionPreference.rejection) == "Yes") {
            isRejectedPrefered = true;
        }
        if (isRejectedPrefered && isServicesActivated) {
            return true;
        }
        return false;
    }
    async updateApplicationSettings(data) {
        try {
            const { bulkregistration, emailNotification, fontsize, textcolor, DeactivateBilling24hrs, BackgroundColor, PaidBillsBeforeTransaction, completeFlow, approvalbeforeprinting, includeTax, } = data;
            const values = [
                bulkregistration,
                fontsize,
                textcolor,
                BackgroundColor,
                DeactivateBilling24hrs,
                PaidBillsBeforeTransaction,
                completeFlow,
                approvalbeforeprinting,
                emailNotification,
                includeTax,
            ];
            const result = await promisifyQuery(queries_1.q_TruncateTable);
            if (!result)
                return false;
            const isUpdated = rowAffected(await promisifyQuery(queries_1.q_update_general_app_set, values));
            return isUpdated;
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async updateSmsSettings(data) {
        return rowAffected(await promisifyQuery(queries_1.q_update_sms_settings, [data]));
    }
    async getSmsSettings() {
        const result = await promisifyQuery(queries_1.q_get_sms_settings);
        if (result.length == 0)
            return null;
        const { smsSettings } = result[0];
        return JSON.parse(smsSettings);
    }
    async updateEmailPreference(data) {
        const { registration, rejection, result, approval, transactions, birthday, billing } = data;
        const truncate = rowAffected(await promisifyQuery(queries_1.q_truncateEmailPreference));
        if (!truncate)
            return "operation failed" /* AppError.failed */;
        const values = [registration, result, rejection, approval, transactions, birthday, billing];
        const outcome = rowAffected(await promisifyQuery(queries_1.q_update_email_preference, values));
        return outcome ? "success" /* AppError.success */ : "operation failed" /* AppError.failed */;
    }
    async getRegistrationSettings() {
        return await promisifyQuery(queries_1.q_registration_settings);
    }
    async updateRegisFields(id, data, employeeid) {
        return rowAffected(await promisifyQuery(queries_1.q_update_reg_fields, [data, employeeid, id]));
    }
    async insertRegistrationSettings(fields, employeeid) {
        return rowAffected(await promisifyQuery(queries_1.q_insert_reg_settings, [JSON.stringify(fields), employeeid]));
    }
    async updateRegistrationFields(data) {
        const { fields, employeeid } = data;
        if (!fields || !employeeid) {
            throw new ReferenceError("fields or employeeid not provided");
        }
        const previous = await this.getRegistrationSettings();
        if (previous.length > 0) {
            const fieldid = previous[0]["id"];
            return await this.updateRegisFields(fieldid, JSON.stringify(fields), employeeid);
        }
        else {
            return await this.insertRegistrationSettings(fields, employeeid);
        }
    }
    async getGeneralEmailSettings() {
        return await promisifyQuery(queries_1.q_general_email_settings);
    }
    async updateGeneralEmailSettings(records) {
        if (typeof records != "object")
            return false;
        // first truncate the table
        let isTruncated = await promisifyQuery(queries_1.q_truncateGeneralSettings);
        if (isTruncated) {
            //       return new EmailService().insertEmailSettings(records);
        }
    }
    async isApprovalSetTrue() {
        const result = await this.getAllAppSettings();
        if (result.length > 0) {
            const approval_status = result[0]["approvalbeforeprinting"];
            return !(parseInt(approval_status) === 0);
        }
        return false;
    }
}
exports.default = ApplicationSettings;
