"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../logger"));
const helper_1 = require("../../../helper");
const queries_1 = __importDefault(require("./queries"));
class ClinicianController {
    async getClinicians(req, res) {
        try {
            const { count, page } = req.query;
            if (parseInt(count, 10) > 0 && parseInt(page, 10) >= 0) {
                let result = await (0, helper_1.paginationQuery)({ page, count }, queries_1.default.getCliniciansWithPagination);
                result = result.length > 0 ? result.map((item) => (0, helper_1.convertKeysToLowerCase)(item)) : result;
                res.send({ statusCode: 200, status: "success", result });
            }
            else {
                let result = await (0, helper_1.promisifyQuery)(queries_1.default.getAllClinicians);
                result = result.length > 0 ? result.map((item) => (0, helper_1.convertKeysToLowerCase)(item)) : result;
                res.send({ statusCode: 200, status: "success", result });
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send({ statusCode: 500, status: "error", message: "Internal server error" });
        }
    }
    async getClinicianBasicInfo(clinicianid) {
        return await (0, helper_1.promisifyQuery)(queries_1.default.getClinicianBasicInfo, [clinicianid]);
    }
    async putCliniciansBasic(req, res) {
        const { name, phone, email, location, address, occupation, id } = req.body;
        if (!id) {
            (0, helper_1.customError)("Clinician id not added", 404, res);
            return;
        }
        if (!(await this.isClinicianExist(email, phone))) {
            (0, helper_1.customError)("Clinician not found", 200, res);
            return;
        }
        const values = [name, phone, email, location, address, occupation, id];
        try {
            const isUpdated = await (0, helper_1.promisifyQuery)(queries_1.default.updateClinicianBasicInfo, values);
            if ((0, helper_1.rowAffected)(isUpdated)) {
                res.send({
                    statusCode: 200,
                    message: "Clinician updated successfully",
                    status: "success",
                });
            }
            else {
                res.send({
                    statusCode: 401,
                    message: "Clinician not updated",
                });
            }
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("Error updating clinician", 500, res);
        }
    }
    async deleteClinicians(req, res) {
        try {
            const { id } = req.body;
            if (!id) {
                return (0, helper_1.customError)("id required", 404, res);
            }
            const result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(queries_1.default.deleteClinicianById, [parseInt(id)]));
            if (result) {
                res.send({
                    statusCode: 200,
                    status: "success",
                    message: "Deleted successfully",
                });
            }
            else {
                res.send({
                    statusCode: 500,
                    status: "error",
                    message: "Something went wrong. Wrong ID provided",
                });
            }
        }
        catch (err) {
            logger_1.default.error(err);
            (0, helper_1.customError)("Error deleting clinician record", 500, res);
        }
    }
    async isClinicianExist(email, mobile) {
        if (!email || !mobile)
            return false;
        const matched = await (0, helper_1.promisifyQuery)(`SELECT * FROM clinicianbasicinfo WHERE EMAIL = ? OR phone = ?`, [email, mobile]);
        return matched.length > 0 ? true : false;
    }
    async postClinicianBasicInfo(req, res) {
        const { id, name, phone, email, location, address, occupation, organization } = req.body;
        if (!phone || !email)
            return "Phone number and email required";
        const isValidNumber = (number) => {
            return number.length === 10 && (number.startsWith("0") || number.startsWith("0"));
        };
        if (!isValidNumber(phone) || !email.includes("@"))
            return "Valid phone number and email required";
        if (await this.isClinicianExist(email, phone))
            return "Email or phone number is already registered with a clinician";
        const values = [name, phone, email, location, address, occupation, organization];
        try {
            const result = await (0, helper_1.promisifyQuery)(queries_1.default.insertClinicianBasicInfo, values);
            const { insertId } = result;
            if (insertId !== 0) {
                const random = require("crypto").randomBytes(5).toString("hex");
                const tempCredentials = `UPDATE clinicianscredentials SET password  = ?`;
                await (0, helper_1.promisifyQuery)(tempCredentials, [random]);
                return insertId;
            }
            return "Adding new clinician failed";
        }
        catch (err) {
            logger_1.default.error(err);
            return "Error adding new clinician";
        }
    }
    async getSingleClinician(req, res) {
        try {
            const { id } = req.query;
            const result = await (0, helper_1.promisifyQuery)(queries_1.default.getSingleClinicianById, [id]);
            return res.send({
                statusCode: 200,
                result,
                status: "success",
            });
        }
        catch (err) {
            res.send({
                statusCode: 500,
                status: "error",
                message: "Error fetching clinician data",
            });
        }
    }
    async getTopPerformingClinicians(req, res) {
        const { count } = req.query;
        if (!count) {
            res.send({
                message: "Count representing top count required",
                statusCode: 401,
                status: "warning",
            });
            return;
        }
        try {
            const result = await (0, helper_1.promisifyQuery)(queries_1.default.getTopPerformingClinicians, [count]);
            res.send({
                result,
                statusCode: 200,
                status: "success",
            });
        }
        catch (err) {
            logger_1.default.error(err);
            res.send({
                message: "Error retrieving top performing clinicians",
                statusCode: 500,
                status: "error",
            });
        }
    }
    async getClinicianResult(clinicianid, startdate, enddate) {
        try {
            let values = [clinicianid];
            let query = queries_1.default.getClinicianResult;
            if (startdate && enddate) {
                query += ` AND DATE(b.billedon) BETWEEN ? AND ?`;
                values.push(startdate);
                values.push(enddate);
            }
            else {
                query += ` AND DATE(b.billedon) = DATE(CURRENT_DATE) ORDER BY b.billedon DESC`;
            }
            const result = await (0, helper_1.promisifyQuery)(query, values);
            return result;
        }
        catch (error) {
            logger_1.default.error(error);
            return [];
        }
    }
    async getBillingTestBasedByClinician(billingid, clinicianid) {
        const query = queries_1.default.getBillingTestBasedByClinician;
        const result = await (0, helper_1.promisifyQuery)(query, [clinicianid, billingid]);
        return result;
    }
}
exports.default = new ClinicianController();
