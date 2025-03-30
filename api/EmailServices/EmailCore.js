const logger = require("../../logger")
const nodemailer = require("nodemailer")
const database_queries = require("../database/queries")
const ejs = require("ejs")
const path = require("path")
const { promisifyQuery } = require("../../helper")
const Registration = require("../models/registration")
const User = require("../LobnosAuth/user")
const EmailQueries = require("./EmailQueries")

class EmailService {
    constructor(employeeid) {
        this.employeeid = employeeid
        this.user = process.env.PROD_PLS_EMAIL_USER
        this.password = process.env.PROD_PLS_EMAIL_PASSWORD
        this.company = process.env.PROD_PLS_EMAIL_COMPANY
        this.provider = process.env.PROD_PLS_EMAIL_PROVIDER
    }

    validateCredentials(user, password, provider, company) {
        return user && password && provider && company
    }

    mailOptions(targetEmail, subject, html) {
        return { from: this.company, to: targetEmail, subject, html }
    }

    async transportEmail(mailOptions) {
        if (!this.user || !this.password || !this.company || !this.provider) {
            throw new Error(`right credentials not provided`)
        }

        if (!mailOptions) {
            throw new Error(`mailoption not provided`)
        }

        if (mailOptions) {
            if (typeof mailOptions != "object") {
                throw new TypeError("mail options must be an object")
            }

            const keys = Object.keys(mailOptions)
            if (!keys.includes("to") || !keys.includes("from") || !keys.includes("subject")) {
                throw new Error("from or to or subject not provided")
            }
        }
        let transport = nodemailer.createTransport({ service: this.provider, auth: { user: this.user, pass: this.password } })
        return await transport.sendMail(mailOptions)
    }

    /**
     * Validates the token data.
     * @param {object} token - The token object.
     * @param {string} token.email - The email address.
     * @param {string} token.patientid - The patient ID.
     * @returns {boolean} - Returns true if the token data is valid, otherwise false.
     */
    validateTokenData = function (token) {
        const { email, target, identifier } = token
        return email && target && identifier
    }
    /**
     *
     * @param {*} token generated user token valid for a pacticular period
     * @returns
     */
    async verifyClientAuthToken(token) {
        try {
            const ourDecodedToken = await new User().verifyToken(token)
            const tokenValid = this.validateTokenData(ourDecodedToken)
            if (!tokenValid) return "Invalid token"

            var isValidId = false
            const { email, target, identifier } = ourDecodedToken

            switch (target) {
                case "patient":
                    isValidId = await new Registration().checkPatientIdExist(identifier)
                    break
                case "clinician":
                    const data = await database_queries.getsingleid(identifier, `clinicianbasicinfo`, `id`)
                    if (data.length == 0) {
                        isValidId = false
                    } else {
                        isValidId = email == data[0]["email"]
                    }
                    break
                default:
                    isValidId = false
            }

            if (!isValidId) return "Invalid identifier"
            const isAuthenticated = await this.isEmailAuthenticated(identifier, target)

            if (isAuthenticated) {
                return "Already Authenticated"
            }
            const emailQ = new EmailQueries()
            const isModeUpdated = await emailQ.updateAuthMode(target, identifier)
            if (!isModeUpdated) return isModeUpdated
            // send temporary creentials
            const getCredentials = await emailQ.getTempClinicianCredentials(identifier)
            if (getCredentials && Array.isArray(getCredentials) && getCredentials.length > 0) {
                const { password } = getCredentials[0]
                // send initial credentials.
                this.sendTemporaryCredentials({ identifier: password, email })
                return isModeUpdated
            }
        } catch (err) {
            logger.error(err)
            throw new Error(err)
        }
    }

    /**
     * Sends temporary credentials to a patient's email.
     * @param {string} patientid - The ID of the patient.
     * @param {string} email - The email address of the patient.
     * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the email was sent successfully.
     */
    async sendTemporaryCredentials(credentials) {
        const { identifier, email } = credentials
        if (!identifier || !email) return "Required credentials details not provided"

        const html = await ejs.renderFile(path.join(__dirname, "../views", "templates" + "/temporaryLogins.ejs"), { data: credentials })

        const issent = await this.transportEmail(this.mailOptions(email, "Temporary Patient Portal Access Credentials ", html))
        console.log(issent)
        // !issent && this.emailLogdb("temporary credentials", patientid, false, "email not sent")

        return issent
    }

    generateToken = async (data, duration = "30m") => {
        if (!data) return false
        return await new User().tokenizeData(data, duration)
    }

    async sendAuthenticateEmail(token, email, subject = "EMAIL VERIFICATION") {
        try {
            if (!token)
                throw new Error('token not provided');
            if (!email)
                throw new Error('email not provided');
            // render html using ejs templating egine
            const pathLoc = path.join(__dirname, "../views", "templates" + "/verifyemail.ejs")
            const html = await ejs.renderFile(pathLoc, { token });
            // forward the email
            return this.transportEmail(this.mailOptions(email, subject, html))
        } catch (err) {
            logger.error(err)
            throw new Error(err)
        }
    }

    async fireClientAuthentication(email, target, identifier) {
        try {
            if (!email || !target) return false
            if (target != "clinician" && !identifier) return false
            const patternValid = email.length > 5 && email.includes(".") && email.includes("@")
            if (!patternValid) return false
            let tokendata = { email, identifier, target }
            const token = await this.generateToken(tokendata)
            if (token) await this.sendAuthenticateEmail(token, email)
            this.emailLogdb("Authentication email", identifier, true, "email sent") // success are logged in the database;
            return true
        } catch (err) {
            logger.error(err)
            this.emailLogdb("Authentication email", identifier, false, "email not sent") // failures
        }
    }

    /**
     * Retrieves temporary credentials for a patient.
     * @param {number} patientid - The ID of the patient.
     * @param {object} response - The response object (optional).
     * @returns {object|boolean} - The temporary credentials or false if not found.
     * @throws {Error} - If there is an error retrieving the credentials.
     */
    async getTempPatientCredentials(patientid, response) {
        try {
            if (!patientid || typeof patientid !== "number")
                throw new Error("Patientid must be type Number")
            const query = `SELECT * FROM patients_credentials where PATIENTID = ?`
            const outcome = await promisifyQuery(query, patientid)
            if ((outcome && outcome.length == 0) || outcome[0]["updated"] == "true") {
                return false
            }
            const { username, password } = outcome[0]
            return response ? response.send({ result: outcome[0] }) : { username, password }
        } catch (err) {
            logger.error(err)
            throw new Error(err)
        }
    }

    // TODO: Add the test in which the sample has been rejected
    /**
     * Triggers the sending of a sample rejection email.
     *
     * @param {number} billingid - The ID of the billing.
     * @param {string} message - The rejection message.
     * @returns {Promise<void>} - A promise that resolves when the email is sent.
     */
    async triggerSampleRejectionEmail(billingid, message) {
        // use the billing id to retrieve the patientid
        try {
            const billdata = await database_queries.getsingleid(parseInt(billingid), "billing", "BILLINGID")
            if (billdata.length <= 0) return false

            const { patientid } = billdata[0]
            // use the patient id to get the email
            const person = await database_queries.getsingleid(parseInt(patientid), "new_patients", "PATIENTID")
            if (person.length === 0 || person[0]?.email === null) return false
            const { email } = person[0]

            const pathname = path.join(__dirname, "../views", "templates" + "/sampleRejection.ejs")
            const data = { message, header: "SAMPLE REJECTION NOTIFICATION", labname: process.env.PROD_PLS_EMAIL_COMPANY }
            const html = await ejs.renderFile(pathname, { data })
            const mailOptions = this.mailOptions(email, "SAMPLE REJECTION NOTIFICATION", html)

            const status = await this.transportEmail(mailOptions)
            return status
        } catch (err) {
            logger.error(err)
            throw new Error(err)
        }
    }

    /**
     * Checks if the email service is activated.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the email service is activated.
     */

    /**
     * Checks if the selected preference is activated.
     * @param {string} target - The target preference to check.
     * @returns {boolean} - Returns true if the selected preference is activated, false otherwise.
     */
    async selectedPreferenceActivated(target) {
        const clientPreference = await this.getEmailPreference()
        if (clientPreference.length > 0 && clientPreference[0][target]) {
            return target === "No" ? false : true
        }
    }

    async clientMailing(patientid, email, callback) {
        const isMailServiceActivated = await this.isEmailServiceActivated();
        const pref = await this.selectedPreferenceActivated('registration');
        if (isMailServiceActivated && pref) {
            const patientRecords = await runPromise(`SELECT * FROM patients_settings WHERE patientid = ?`, [patientid])
            if (patientRecords.length > 0 && patientRecords[0]["method"] === "email") {
                // default is sending message after new client is registered;
                // however if a call back is prrovided, it is treated as first class and fired
                if (callback && typeof callback === "function") {
                    callback()
                    return
                }
                this.fireClientAuthentication(patientid, email)
            }
        }
    }
    /**
     * Inserts email log data into the emaillog table in the database.
     *
     * @param {string} type - The type of email log.
     * @param {number} target - The billingid of the email log.
     * @param {boolean} success - Indicates whether the email was sent successfully or not.
     * @param {string} [reason] - The reason why the email was not sent successfully.
     * @returns {Promise<any>} - The result of the query.
     * @throws {Error} - If an error occurs during the execution of the query.
     */
    async emailLogdb(typer, target, success, reason) {
        if (!typer || !target || !success) return "all parameters not provided"
        try {
            const query = `INSERT INTO emaillog (type,target,success,reason) VALUES(?,?,?,?)`
            const result = await promisifyQuery(query, [typer, target, success, reason])
            return result
        } catch (err) {
            throw new Error(err)
        }
    }

    async getEmailSettings() {
        try {
            return await promisifyQuery(`SELECT * FROM generalemailsettings`)
        } catch (err) {
            logger.error(err)
        }
    }

    /**
     * Sends a billing receipt email to the specified email address.
     * @param {string} billingid - The ID of the billing.
     * @returns {Promise<boolean|string>} - A promise that resolves to true if the email is sent successfully, or 'email not provided' if the email address is not provided, or false if the necessary data is missing.
     * @throws {Error} - If an error occurs while sending the email.
     */
}


const CONSTANT = async function () {
    const e = new EmailService();
    const html = await ejs.renderFile(path.join(__dirname, '../EmailTemplates/appointmentsheduleNotice.ejs'))
    const options = e.mailOptions('asananyaaba45@gmail.com', 'APPOINTMENT REMINDER', html);
    e.transportEmail(options)
        .then((data) => console.log(data))
        .catch((err) => console.log(err))
}


// CONSTANT()
module.exports = EmailService
