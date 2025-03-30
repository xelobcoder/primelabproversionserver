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
const logger_1 = __importDefault(require("../../../logger"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// import * as database_queries from "../database/queries";
const user_1 = __importDefault(require("../../LobnosAuth/user"));
const registration_1 = __importDefault(require("../../models/registration"));
const testpanel = __importStar(require("../../testpanel/list"));
const queries_1 = require("./queries");
class Patient extends registration_1.default {
    constructor(patientid) {
        super(patientid);
        this.runqueryPromise = helper_1.promisifyQuery;
    }
    async getTransactionsByDate(patientid, to, from) {
        const isArgGiven = arguments.length > 0 && typeof arguments[0] == "number" ? patientid : this.patientid;
        if (await this.checkPatientIdExist()) {
            let query = queries_1.PatientQuery.getTransactionsByDate;
            let values = [isArgGiven];
            if (from && to) {
                query += ` AND DATE BETWEEN ? AND ?`;
                values = [...values, from, to];
            }
            return this.runqueryPromise(query, values);
        }
        else {
            return `patientid ${isArgGiven} not found`;
        }
    }
    async updateCredentials(request, response) {
        const { opassword, npassword, nppassword, username } = request.body;
        let oldpassworldMatched = null;
        const isValid = await this.checkPatientIdExist(username);
        const matched = nppassword === nppassword;
        const db_old_password = await database_queries.getsingleid(username, "patients_credentials", "patientid");
        if (Array.isArray(db_old_password) && db_old_password.length > 0) {
            const { username, password, updated } = db_old_password[0];
            if (updated == "true") {
                const compare = await bcrypt_1.default.compare(opassword, password);
                oldpassworldMatched = compare;
            }
            else {
                oldpassworldMatched = opassword === password;
            }
        }
        if (!isValid) {
            (0, helper_1.customError)("Invalid membership id or username", 404, response);
            return;
        }
        if (!matched) {
            (0, helper_1.customError)("new password match error", 404, response);
            return;
        }
        if (!oldpassworldMatched) {
            (0, helper_1.customError)(`invalid old password credentials`, 404, response);
        }
        if (isValid && matched && oldpassworldMatched) {
            const hashedPassword = await new user_1.default(username, npassword).hashPassword();
            const updateQuery = queries_1.PatientQuery.updateCredentials;
            try {
                const result = await this.runqueryPromise(updateQuery, [hashedPassword, username]);
                if (result && result.affectedRows == 1) {
                    response.send({ status: "success", statusCode: 200, message: "patient credentials updated successfully" });
                }
            }
            catch (err) {
                logger_1.default.error(err);
                (0, helper_1.customError)(err.message, 500, response);
            }
        }
    }
    async updateNotificationSettings(request, response) {
        const { mode, method, notify, patientid } = request.body;
        if (mode && method && notify && patientid) {
            const updateQuery = queries_1.PatientQuery.updateNotificationSettings;
            const updated = await this.runqueryPromise(updateQuery, [mode, method, notify, parseInt(patientid)]);
            if (updated && updated.affectedRows == 1) {
                response.send({ status: "success", statusCode: 200, message: "patient settings updated successfully" });
            }
        }
        else {
            (0, helper_1.customError)(`mode of result, method of delivery and notification settings required`, 404, response);
        }
    }
    async transformDataset(list, data) {
        return list
            .map((item, index) => {
            const filtered = data.filter((e, i) => {
                if (e.billingid == parseInt(item)) {
                    return (0, helper_1.convertKeysToLowerCase)(e);
                }
            });
            return { billingid: item, data: filtered, date: filtered.length > 0 ? filtered[0]["created_on"] : null };
        })
            .sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
    }
    async getParameters(data) {
        let parameters = [];
        data.map((item, index) => {
            if (!parameters.includes(item === null || item === void 0 ? void 0 : item.parameter)) {
                parameters.push(item === null || item === void 0 ? void 0 : item.parameter);
            }
        });
        return parameters;
    }
    async getPatientBillingRecords(details) {
        const { patientid, count = 10, page = 1, startdate, enddate } = details;
        if (!patientid || isNaN(patientid))
            throw new Error("patientid required");
        let query, values = [];
        if (startdate && enddate) {
            const startYear = new Date(startdate).getFullYear();
            const endYear = new Date(enddate).getFullYear();
            const stMonth = new Date(startdate).getMonth();
            const edMonth = new Date(enddate).getMonth();
            let partitions = await this.billingPartitionPrunner(startdate, enddate);
            query = queries_1.PatientQuery.getPatientBillingRecordsWithPartition;
            values = [patientid, startYear, endYear, count, (page - 1) * count];
        }
        else if (startdate) {
            const startYear = new Date(startdate).getFullYear();
            query = queries_1.PatientQuery.getPatientBillingRecordsStartDate;
            values = [patientid, startYear, count, (page - 1) * count];
        }
        else {
            query = queries_1.PatientQuery.getPatientBillingRecords;
            values = [patientid, count, (page - 1) * count];
        }
        const result = await (0, helper_1.promisifyQuery)(query, values);
        return result;
    }
    async getPatientFullBloodCountTrend(listArray) {
        const trendDataSet = await (0, helper_1.getFullBloodCountTrend)(this.patientid);
        const transformed = await this.transformDataset(listArray, trendDataSet);
        const parameters = await this.getParameters(trendDataSet);
        return { trend: transformed, category: "fbc", supported: true, parameters };
    }
    async getPatientTestTrend(patientid, testid, testname, instances) {
        if (!patientid) {
            throw new Error("patientid required");
        }
        if (!testid) {
            throw new Error("testid required");
        }
        if (!testname) {
            throw new Error("testname required");
        }
        if (!instances) {
            throw new Error("instances required");
        }
        const hasTrendActivated = await testpanel.hasTrend(testid);
        if (!hasTrendActivated)
            return `test trend not setup/activated for this test in test creation`;
        const tableName = "result" + testpanel.generateTableName(testname);
        if (!tableName)
            throw new Error("tableName not found");
        let instancesSearch = "";
        if (instances) {
            instancesSearch = await (0, helper_1.promisifyQuery)(`SELECT DISTINCT billingid FROM ${tableName} WHERE patientid = ? LIMIT ?`, [
                parseInt(patientid),
                parseInt(instances),
            ]);
            if (instancesSearch.length != 0) {
                instancesSearch = instancesSearch.map((a, index) => a.billingid).join(",");
            }
        }
        const query = `SELECT field, value, billingid, created_on AS date FROM ${tableName}  WHERE billingid IN (${instancesSearch}) ORDER BY id DESC`;
        let result = await (0, helper_1.promisifyQuery)(query);
        if (result.length != 0) {
            let fields = [];
            result.map((item, index) => {
                !fields.includes(item.field) && fields.push(item.field);
            });
            if (fields.length != 0) {
                const categorized = fields.map((a, index) => {
                    const resultInstances = result
                        .filter((item, index) => {
                        return item.field == a;
                    })
                        .sort((a, b) => a.billingid - b.billingid);
                    return { field: a, data: resultInstances };
                });
                return categorized;
            }
        }
        return result;
    }
}
exports.default = Patient;
