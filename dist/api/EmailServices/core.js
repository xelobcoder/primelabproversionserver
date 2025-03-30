"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createEnv_1 = require("./createEnv");
class Core {
    constructor() {
        this.isEnv = process.env.PROD_PLS_EMAIL_USER != undefined &&
            process.env.PROD_PLS_EMAIL_PROVIDER != undefined && process.env.PROD_PLS_EMAIL_COMPANY != undefined && process.env.PROD_PLS_EMAIL_PASSWORD != undefined;
        if (!this.isEnv) {
            throw new Error('system Env missing');
        }
    }
    createMailTransporter(mailOptions) {
        if (!this.isEnv)
            return "Production Variables not set" /* EFailures.ENV_VARIABLES_FAILED */;
        return (0, createEnv_1.createEmailTransport)(mailOptions);
    }
    notificationPatientRegistration(patientid, email, callback) {
        throw new Error("Method not implemented.");
    }
    notificationSampleRejection(data) {
        throw new Error("Method not implemented.");
    }
    authenticationMailService(data) {
        throw new Error("Method not implemented.");
    }
    notificationBillingReceipt(data) {
        throw new Error("Method not implemented.");
    }
    verifyClientAuthenticationToken(token) {
        throw new Error("Method not implemented.");
    }
    isEmailServicesActivated() {
        throw new Error("Method not implemented.");
    }
    isMailChosenPatientNotic(patientid) {
        throw new Error("Method not implemented.");
    }
}
exports.default = Core;
