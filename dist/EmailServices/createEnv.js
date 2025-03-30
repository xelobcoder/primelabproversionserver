"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailTransport = exports.hasEnvVariable = void 0;
const nodemailer_1 = require("nodemailer");
function hasEnvVariable(data, target) {
    return typeof data === "object" && typeof target == "string" && target in data;
}
exports.hasEnvVariable = hasEnvVariable;
async function createEmailTransport(mailOptions) {
    const { to, subject, html } = mailOptions;
    if (!to || !subject || !html)
        return "Invalid mailoptions provided, must include subject, html and target email" /* EFailures.INV_MAIL_OPT */;
    return await (0, nodemailer_1.createTransport)({
        service: process.env.PROD_PLS_EMAIL_PROVIDER,
        auth: {
            pass: process.env.PROD_PLS_EMAIL_PASSWORD,
            user: process.env.PROD_PLS_EMAIL_USER
        },
    }).sendMail(Object.assign({ from: process.env.PROD_PLS_EMAIL_COMPANY }, mailOptions));
}
exports.createEmailTransport = createEmailTransport;
