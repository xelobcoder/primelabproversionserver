"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = require("nodemailer");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("./../../helper");
const registration_1 = __importDefault(require("../models/registration/registration"));
const user_1 = __importDefault(require("../LobnosAuth/user"));
const EmailQueries_1 = __importDefault(require("./EmailQueries"));
const logger_1 = __importDefault(require("../../logger"));
const clinicianClass_1 = __importDefault(require("../models/clincians/clinicianClass"));
const billing_1 = require("../models/billing/billing");
// console.log(
// new Core().createMailTransporter({to:'hamzatiifu45@gmail.com',subject:'tui',html: '<h1>Tiifu</h1>' })
// )
class EmailService {
    constructor(employeeid) {
        /**
         * Generates a token with optional expiration duration.
         * @param {object} data - The data to be encoded in the token.
         * @param {string} duration - The optional duration for which the token is valid (default: '30m').
         * @returns {Promise<string>} - A promise that resolves to the generated token.
         */
        this.generateToken = async (data, duration = "30m") => {
            if (!data)
                return "";
            return await new user_1.default(null).tokenizeData(data, duration);
        };
        this.employeeid = employeeid;
        this.user = process.env.PROD_PLS_EMAIL_USER || "";
        this.password = process.env.PROD_PLS_EMAIL_PASSWORD || "";
        this.company = process.env.PROD_PLS_EMAIL_COMPANY || "";
        this.provider = process.env.PROD_PLS_EMAIL_PROVIDER || "";
    }
    validateCredentials(user, password, provider, company) {
        return !!(user && password && provider && company);
    }
    mailOptions(targetEmail, subject, html) {
        return { from: this.company, to: targetEmail, subject, html };
    }
    async transportEmail(mailOptions) {
        try {
            if (!this.user || !this.password || !this.company || !this.provider) {
                throw new Error(`Right credentials not provided`);
            }
            if (typeof mailOptions !== "object" || !mailOptions) {
                throw new TypeError("Mail options must be an object");
            }
            const keys = Object.keys(mailOptions);
            if (!keys.includes("to") || !keys.includes("from") || !keys.includes("subject")) {
                throw new Error("From, to, or subject not provided");
            }
            let transport = (0, nodemailer_1.createTransport)({ service: this.provider, auth: { user: this.user, pass: this.password } });
            return await transport.sendMail(mailOptions);
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Validates the token data.
     * @param {object} token - The token object.
     * @param {string} token.email - The email address.
     * @param {string} token.patientid - The patient ID.
     * @returns {boolean} - Returns true if the token data is valid, otherwise false.
     */
    validateTokenData(token) {
        const { email, target, identifier } = token;
        return !!(email && target && identifier);
    }
    /**
     * Verifies client authentication token.
     * @param {string} token - The authentication token.
     * @returns {Promise<string|boolean>} - A promise that resolves to a string indicating the status of token verification.
     */
    async verifyClientAuthToken(token) {
        try {
            const ourDecodedToken = await new user_1.default().verifyToken(token);
            const tokenValid = this.validateTokenData(ourDecodedToken);
            if (!tokenValid)
                return "Invalid token";
            let isValidId = false;
            const { email, target, identifier } = ourDecodedToken;
            switch (target) {
                case "patient":
                    isValidId = await new registration_1.default().checkPatientIdExist(identifier);
                    break;
                case "clinician":
                    const data = await clinicianClass_1.default.getClinicianBasicInfo(identifier);
                    isValidId = data.length > 0 && email === data[0]["email"];
                    break;
                case "supplier":
                    break;
                default:
                    isValidId = false;
            }
            if (!isValidId)
                return "Invalid identifier";
            const isAuthenticated = await this.isEmailAuthenticated(identifier, target);
            if (isAuthenticated)
                return "Already Authenticated";
            const emailQ = new EmailQueries_1.default(null);
            const isModeUpdated = await emailQ.updateAuthMode(target, identifier);
            if (!isModeUpdated)
                return isModeUpdated;
            const getCredentials = await emailQ.getTempClinicianCredentials(identifier);
            if (getCredentials && Array.isArray(getCredentials) && getCredentials.length > 0) {
                const { password } = getCredentials[0];
                this.sendTemporaryCredentials({ identifier: password, email });
                return isModeUpdated;
            }
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Sends temporary credentials to a recipient's email.
     * @param {object} credentials - The temporary credentials object.
     * @returns {Promise<any>} - A promise that resolves to the result of sending the email.
     */
    async sendTemporaryCredentials(credentials) {
        const { identifier, email } = credentials;
        if (!identifier || !email)
            return "Required credentials details not provided";
        const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../views", "templates", "temporaryLogins.ejs"), { data: credentials });
        const issent = await this.transportEmail(this.mailOptions(email, "Temporary Patient Portal Access Credentials", html));
        return issent;
    }
    /**
     * Sends an email for client authentication.
     * @param {string} token - The authentication token.
     * @param {string} email - The recipient email address.
     * @param {string} [subject="EMAIL VERIFICATION"] - The email subject (default: "EMAIL VERIFICATION").
     * @returns {Promise<any>} - A promise that resolves to the result of sending the email.
     */
    async sendAuthenticateEmail(token, email, subject = "EMAIL VERIFICATION") {
        try {
            if (!token)
                throw new Error("Token not provided");
            if (!email)
                throw new Error("Email not provided");
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../../api/EmailTemplates/supplierEmailVerification.ejs"), { token });
            return this.transportEmail(this.mailOptions(email, subject, html));
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Retrieves temporary credentials for a patient.
     * @param {number} patientid - The ID of the patient.
     * @param {object} [response] - The optional response object.
     * @returns {object|boolean} - The temporary credentials or false if not found.
     * @throws {Error} - If there is an error retrieving the credentials.
     */
    async getTempPatientCredentials(patientid, response) {
        try {
            if (!patientid || typeof patientid !== "number")
                throw new Error("Patient ID must be a number");
            const query = `SELECT * FROM patients_credentials WHERE PATIENTID = ?`;
            const outcome = await (0, helper_1.promisifyQuery)(query, patientid);
            if (!outcome || outcome.length === 0 || outcome[0]["updated"] === "true") {
                return false;
            }
            const { username, password } = outcome[0];
            return response ? response.send({ result: outcome[0] }) : { username, password };
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Triggers the sending of a sample rejection email.
     * @param {number} billingid - The ID of the billing.
     * @param {string} message - The rejection message.
     * @returns {Promise<boolean>} - A promise that resolves to true if the email is sent successfully.
     * @throws {Error} - If there is an error sending the email.
     */
    async triggerSampleRejectionEmail(billingid, message) {
        var _a;
        try {
            // new Billing().get
            const billdata = await new billing_1.Billing().getTransactionBillData(billingid);
            if (billdata.length === 0)
                return false;
            const { patientid } = billdata[0];
            const person = await new registration_1.default().getPatientBasicData(patientid);
            if (person.length === 0 || (person.length > 0 && !((_a = person[0]) === null || _a === void 0 ? void 0 : _a.email)))
                return false;
            const { email } = person[0];
            const pathname = path_1.default.join(__dirname, "../views", "templates", "sampleRejection.ejs");
            const data = { message, header: "SAMPLE REJECTION NOTIFICATION", labname: process.env.PROD_PLS_EMAIL_COMPANY };
            const html = await ejs_1.default.renderFile(pathname, { data });
            const mailOptions = this.mailOptions(email, "SAMPLE REJECTION NOTIFICATION", html);
            const status = await this.transportEmail(mailOptions);
            return !!status;
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Checks if the selected preference is activated.
     * @param {string} target - The target preference to check.
     * @returns {boolean} - Returns true if the selected preference is activated, false otherwise.
     */
    async selectedPreferenceActivated(target) {
        const clientPreference = await this.getEmailPreference();
        if (clientPreference.length > 0 && clientPreference[0][target]) {
            return target === "No" ? false : true;
        }
        return false;
    }
    /**
     * Sends a billing receipt email to the specified email address.
     * @param {string} billingid - The ID of the billing.
     * @returns {Promise<boolean|string>} - A promise that resolves to true if the email is sent successfully, or 'email not provided' if the email address is not provided, or false if the necessary data is missing.
     * @throws {Error} - If an error occurs while sending the email.
     */
    async sendBillingReceiptEmail(billingid) {
        var _a;
        try {
            if (!billingid)
                throw new Error("Billing ID not provided");
            // Fetch billing and patient details
            const billData = await new billing_1.Billing(null).getTransactionBillData(parseInt(billingid));
            if (billData.length === 0)
                return false;
            const { patientid } = billData[0];
            const patientData = await new registration_1.default().getPatientBasicData(patientid);
            if (patientData.length === 0 || !((_a = patientData[0]) === null || _a === void 0 ? void 0 : _a.email))
                return "email not provided";
            const { email } = patientData[0];
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../views/templates/billingReceipt.ejs"), {
            /* data */
            });
            const mailOptions = this.mailOptions(email, "Billing Receipt", html);
            const status = await this.transportEmail(mailOptions);
            return !!status;
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Inserts email log data into the emaillog table in the database.
     * @param {string} type - The type of email log.
     * @param {number} target - The billing ID or other target of the email log.
     * @param {boolean} success - Indicates whether the email was sent successfully or not.
     * @param {string} [reason] - The reason why the email was not sent successfully.
     * @returns {Promise<any>} - The result of the query.
     * @throws {Error} - If an error occurs during the execution of the query.
     */
    async emailLogdb(type, target, success, reason) {
        if (!type || !target || !success)
            return "All parameters not provided";
        try {
            const query = `INSERT INTO emaillog (type, target, success, reason) VALUES (?, ?, ?, ?)`;
            const result = await (0, helper_1.promisifyQuery)(query, [type, target, success, reason || null]);
            return result;
        }
        catch (err) {
            throw new Error(err);
        }
    }
    /**
     * Retrieves email settings from the database.
     * @returns {Promise<any>} - A promise that resolves to the email settings.
     * @throws {Error} - If there is an error retrieving the email settings.
     */
    async getEmailSettings() {
        try {
            return await (0, helper_1.promisifyQuery)(`SELECT * FROM generalemailsettings`);
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    /**
     * Checks if the email service is activated.
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the email service is activated.
     */
    async isEmailServiceActivated() {
        // Implement your logic here to check email service activation
        return true; // Placeholder
    }
    /**
     * Checks if email authentication is activated for the specified identifier and target.
     * @param {string|number} identifier - The identifier (e.g., patient ID or clinician ID).
     * @param {string} target - The target (e.g., 'patient' or 'clinician').
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether email authentication is activated.
     */
    async isEmailAuthenticated(identifier, target) {
        // Implement your logic here to check if email authentication is activated
        return true; // Placeholder
    }
    /**
     * Fires client authentication for a patient or clinician.
     * @param {string} email - The email address.
     * @param {string} target - The target (e.g., 'clinician').
     * @param {string|number} identifier - The identifier (e.g., clinician ID).
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether client authentication was successful.
     */
    async fireClientAuthentication(email, target, identifier) {
        try {
            if (!email || !target)
                return false;
            if (target !== "clinician" && !identifier)
                return false;
            const patternValid = email.length > 5 && email.includes(".") && email.includes("@");
            if (!patternValid)
                return false;
            let tokendata = { email, identifier, target };
            const token = await this.generateToken(tokendata);
            if (token)
                await this.sendAuthenticateEmail(token, email);
            this.emailLogdb("Authentication email", parseInt(identifier), true, "email sent");
            return true;
        }
        catch (err) {
            logger_1.default.error(err);
            this.emailLogdb("Authentication email", parseInt(identifier), false, "email not sent");
            return false;
        }
    }
    /**
     * Retrieves email preference settings.
     * @returns {Promise<any>} - A promise that resolves to the email preference settings.
     */
    async getEmailPreference() {
        return []; // Placeholder
    }
    /**
     * Sends an email for client registration.
     * @param {number} patientid - The ID of the patient.
     * @param {string} email - The email address of the patient.
     * @param {Function} [callback] - Optional callback function.
     * @returns {Promise<void>} - A promise that resolves when the email is sent.
     */
    async RegistrationEmailNotification(patientid, email, callback) {
        const isMailServiceActivated = await this.isEmailServiceActivated();
        const pref = await this.selectedPreferenceActivated("registration");
        if (isMailServiceActivated && pref) {
            const patientRecords = await (0, helper_1.promisifyQuery)(`SELECT * FROM patients_settings WHERE patientid = ?`, [patientid]);
            if (patientRecords.length > 0 && patientRecords[0]["method"] === "email") {
                if (callback && typeof callback === "function") {
                    callback();
                    return;
                }
                this.fireClientAuthentication(email, "patient", patientid.toString());
            }
        }
    }
}
const CONSTANT = async () => {
    const e = new EmailService(null);
    const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../EmailTemplates/appointmentsheduleNotice.ejs"));
    const options = e.mailOptions("asananyaaba45@gmail.com", "APPOINTMENT REMINDER", html);
    try {
        const data = await e.transportEmail(options);
        console.log(data);
    }
    catch (err) {
        console.log(err);
    }
};
// Uncomment the line below to trigger the CONSTANT function
// CONSTANT();
exports.default = EmailService;
