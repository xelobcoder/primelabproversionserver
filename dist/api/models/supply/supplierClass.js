"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const appset_1 = __importDefault(require("../../models/application/appsettings/appset"));
const EmailCore_1 = __importDefault(require("../../EmailServices/EmailCore"));
const queries = __importStar(require("./queries"));
class Supplys {
    constructor(supplierid = null) {
        this.supplierid = supplierid;
    }
    async isSupplierAvailable(contact, email) {
        if (!contact || !email) {
            throw new Error("email or contact required");
        }
        if (!email.includes("@") || !email.includes(".")) {
            return "WRONG EMAIL FORMAT PROVIDED";
        }
        if (contact.toString().length !== 10) {
            return "INCORRECT CONTACT PROVIDED";
        }
        const result = await (0, helper_1.promisifyQuery)(queries.GETSUPPLIER_BY_CONTACT_OR_EMAIL, [contact, email]);
        return result.length === 0;
    }
    async sendEmailVerification(email, data) {
        try {
            const applicationSettings = await new appset_1.default().getAllAppSettings();
            if (applicationSettings.length == 0)
                return false;
            const email_settings = applicationSettings[0];
            if (email_settings.emailNotification === 1) {
                const emailService = new EmailCore_1.default(1);
                const token = await emailService.generateToken(data, "30m");
                emailService.sendAuthenticateEmail(token, email, "EMAIL VERIFICATION NOTICE");
                return;
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async addSupplier(records) {
        const { name, address, email, contactperson, region, phonenumber } = records;
        const canCreate = await this.isSupplierAvailable(phonenumber, email);
        if (canCreate === true) {
            const result = await (0, helper_1.promisifyQuery)(queries.NEWSUPPLIERQUERY, [name, address, email, contactperson, region, phonenumber]);
            if (result.insertId != null) {
                await this.sendEmailVerification(email, { supplierid: result.insertId, email });
                return {
                    message: "supplier account created awaiting email account verification",
                    statusCode: 200,
                    status: "success",
                };
            }
            else {
                return {
                    message: "supplier contact creation failed",
                    statusCode: 404,
                    status: "failed",
                };
            }
        }
        else if (canCreate === false) {
            return { message: "account already exist", statusCode: 404, status: "failed" };
        }
        else {
            return { message: canCreate, statusCode: 400, status: "failed" };
        }
    }
    async deleteSupplier(supplierid) {
        const query = `DELETE FROM supplier WHERE supplierid = ?`;
        const result = await (0, helper_1.promisifyQuery)(query, [supplierid]);
        return result.affectedRows > 0;
    }
    async getSuppliers(data) {
        try {
            return await (0, helper_1.paginationQuery)(data, queries.GETSUPPLIERSQUERY);
        }
        catch (err) {
            throw new Error(err);
        }
    }
    async updateSupplier(records) {
        const { name, address, region, contactperson, email, phonenumber, supplierid } = records;
        if (!supplierid)
            return false;
        const values = [name, address, region, contactperson, email, phonenumber, supplierid];
        const outcome = await (0, helper_1.promisifyQuery)(queries.UPDATESUPPLIERQUERY, values);
        return outcome.affectedRows > 0 ? true : null;
    }
    async getSupplier(supplierid) {
        if (!supplierid)
            return false;
        const query = `SELECT * FROM supplier WHERE supplierid = ?`;
        const result = await (0, helper_1.promisifyQuery)(query, [supplierid]);
        return result;
    }
    async getSupplierPendingOrders(id, status = "data") {
        let supplierid = this.supplierid;
        if (!supplierid) {
            supplierid = id;
        }
        if (!supplierid)
            throw new Error("supplierid not provided");
        const result = await (0, helper_1.promisifyQuery)(queries.GET_PENDING_ORDERS, [supplierid]);
        if (status === "count")
            return { count: result.length };
        return result;
    }
    async postCommodity(records) {
        const { name, category } = records;
        if (!name || !category)
            throw new Error("name and category required");
        const result = await (0, helper_1.promisifyQuery)(queries.INSERT_COMMODITY, [name, category]);
        return result.insertId != null;
    }
    async getCommodity(commodity) {
        if (!commodity)
            throw new Error("commodity required");
        const query = `SELECT * FROM commodity WHERE commodity = ?`;
        const result = await (0, helper_1.promisifyQuery)(query, [commodity]);
        return result;
    }
    async getCommodities(query) {
        return await (0, helper_1.paginationQuery)(query, queries.GET_COMMODITIES);
    }
}
exports.default = Supplys;
