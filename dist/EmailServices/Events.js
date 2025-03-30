"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmailCore_1 = __importDefault(require("./EmailCore"));
const EmailQueries_1 = __importDefault(require("./EmailQueries"));
const invoice_1 = require("../models/invoice");
const logger_1 = __importDefault(require("../../logger"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
class ApplicationEvents extends EmailCore_1.default {
    constructor(employeeid, events) {
        super(employeeid);
        this.events = events;
    }
    hasEvent(key, checker) {
        if (typeof this.events !== "object") {
            throw new TypeError("Object type required");
        }
        if (!this.events[key])
            return false;
        if (typeof checker === "number") {
            return this.events[key] === "0" ? false : true;
        }
        if (typeof checker === "string") {
            return this.events[key] === "Yes" ? true : false;
        }
        return !!this.events[key];
    }
    async forwardBillingReceipt(billingid) {
        var _a;
        try {
            const emailQueries = new EmailQueries_1.default(billingid); // Initialize with billingid
            if (!billingid || typeof billingid !== "number")
                return false;
            const testdata = await (0, invoice_1.testInformation)(billingid);
            const personalInfo = await (0, invoice_1.clientInformation)(billingid);
            const email = (_a = personalInfo[0]) === null || _a === void 0 ? void 0 : _a.email;
            if (!email) {
                return "Email not provided";
            }
            if (testdata.length > 0 && personalInfo.length > 0 && email) {
                const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../views/templates", "billing.ejs"), {
                    data: {
                        testdata,
                        personalInfo: personalInfo[0],
                        facility: this.company,
                    },
                });
                const mail = this.mailOptions(email, "Transaction Alert", html);
                return await this.transportEmail(mail);
            }
            return false;
        }
        catch (err) {
            logger_1.default.error({ type: "email", err });
            throw new Error(err);
        }
    }
    resultApproval(billingid, testname) {
        const result = this.hasEvent("result", "string");
        return result;
    }
}
exports.default = ApplicationEvents;
