"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_path_1 = __importDefault(require("node:path"));
const helper_1 = require("../../../helper");
const securityQueries_1 = require("./securityQueries");
class Security {
    constructor(employeeid, loginDuration) {
        this.employeeid = employeeid;
        this.loginDuration = loginDuration || 3;
        this.sqlConnection = helper_1.promisifyQuery;
        this.isMaster = true;
    }
    isEmployeeid() {
        return this.employeeid !== null && this.employeeid !== undefined;
    }
    async createSessionId() {
        return jsonwebtoken_1.default.sign(this.employeeid, process.env.ACCESS_TOKEN_SECRET);
    }
    validDurationProvided() {
        return this.loginDuration > 0 && this.loginDuration <= 6;
    }
    async insertLoginHistory(browserInformation) {
        const expiryTime = Date.now() + this.loginDuration * 60 * 60 * 1000;
        if (!this.isEmployeeid()) {
            throw new Error("employeeid not provided");
        }
        if (!this.validDurationProvided()) {
            throw new Error("login Duration must be between 1 and 6");
        }
        let sessionId = await this.createSessionId();
        const query = securityQueries_1.queries.insertLoginHistory;
        const values = [this.employeeid, sessionId, expiryTime, JSON.stringify(browserInformation)];
        await this.sqlConnection(query, values);
        return expiryTime;
    }
    currentTimeInMillis() {
        return Date.now();
    }
    async getCurrentLoginCounts() {
        const query = `SELECT COUNT(*) AS count FROM loginlogs WHERE logoutTime > ?`;
        const result = await this.sqlConnection(query, this.currentTimeInMillis());
        return result.length > 0 ? result[0]["count"] : 0;
    }
    async getCurrentUserLoginSessions() {
        if (this.isEmployeeid()) {
            const query = securityQueries_1.queries.getCurrentUserLoginSessions;
            const data = await this.sqlConnection(query, [this.currentTimeInMillis(), this.employeeid]);
            return data;
        }
        return [];
    }
    async getCurrentUserLoginSessionsWithDetails() {
        if (this.isEmployeeid()) {
            const query = securityQueries_1.queries.getCurrentUserLoginSessionsWithDetails;
            let data = await this.sqlConnection(query, [this.currentTimeInMillis(), this.employeeid]);
            if (data.length > 0) {
                data = data.map((item) => {
                    if (item.hasOwnProperty("browserInformation")) {
                        item["browserInformation"] = JSON.parse(item["browserInformation"]);
                    }
                    return item;
                });
            }
            return data;
        }
        return [];
    }
    async getCanInitiateLogin() {
        const data = await this.getCurrentUserLoginSessions();
        return Array.isArray(data) ? data.length === 0 : false;
    }
    async destroyUserSessions() {
        let sessionsKeys = [];
        try {
            const querySelect = securityQueries_1.queries.destroyUserSessionsSelect;
            let result = await this.sqlConnection(querySelect, this.employeeid);
            if (result.length > 0) {
                sessionsKeys = result.map((item) => item === null || item === void 0 ? void 0 : item.loginhxid);
                const queryDelete = securityQueries_1.queries.destroyUserSessionsDelete;
                await this.sqlConnection(queryDelete, [this.employeeid]);
            }
        }
        catch (err) {
            console.log(err);
        }
        finally {
            if (sessionsKeys.length > 0) {
                const updates = sessionsKeys.map(async (item) => {
                    const queryUpdate = securityQueries_1.queries.updateLoginLogs;
                    const updated = await this.sqlConnection(queryUpdate, [Date.now(), item]);
                    return (0, helper_1.rowAffected)(updated);
                });
                const results = await Promise.all(updates);
                const status = results.some((a) => a === false);
                return !status;
            }
        }
    }
    async getEmployeeLoginHistory(page = 1, count = 10) {
        if (!this.isEmployeeid())
            return [];
        const query = securityQueries_1.queries.getEmployeeLoginHistory;
        return await (0, helper_1.paginationQuery)({ page, count }, query, [parseInt(this.employeeid)]);
    }
    async getEmployeeLastLoginSession() {
        if (!this.isEmployeeid())
            return [];
        const query = securityQueries_1.queries.getEmployeeLastLoginSession;
        return await (0, helper_1.promisifyQuery)(query, [this.employeeid]);
    }
    async getGeneralLoginHistory(page = 1, count = 10, employeeid = null) {
        let queryValues = [];
        let query = securityQueries_1.queries.getGeneralLoginHistory;
        if (employeeid && !isNaN(employeeid)) {
            query += ` WHERE rl.employeeid = ?`;
            queryValues.push(employeeid);
        }
        query += ` ORDER BY keyid DESC LIMIT ? OFFSET ?`;
        return await (0, helper_1.paginationQuery)({ page, count }, query, queryValues);
    }
    async getDboSystemSecurity() {
        const query = securityQueries_1.queries.getDboSystemSecurity;
        return await this.sqlConnection(query);
    }
    async environmentSecurity(currentAppPath) {
        try {
            if (typeof currentAppPath !== "string") {
                throw new TypeError("path must be a string");
            }
            const appPath = node_path_1.default.join(__dirname, "../../../app.js");
            const appModels = node_path_1.default.join(__dirname, "../../models");
            const appControllers = node_path_1.default.join(__dirname, "../../controllers");
            const REGISTERED_ENV = await this.getDboSystemSecurity();
            if (REGISTERED_ENV.length === 0) {
                throw new Error("Device not recognized or licensed to run this software");
            }
            const currentComputer = process.env.COMPUTERNAME;
            const currentDomain = process.env.USERDOMAIN;
            const currentSystemRoot = process.env.SYSTEMROOT;
            const registeredComputer = REGISTERED_ENV[0]["computerName"];
            const registeredUser = REGISTERED_ENV[0]["userDomain"];
            const registeredSystemRoot = REGISTERED_ENV[0]["systemRoot"];
            const registeredDirectory = REGISTERED_ENV[0]["appDir"];
            if (registeredComputer !== currentComputer ||
                registeredSystemRoot !== currentSystemRoot ||
                registeredUser !== currentDomain ||
                currentAppPath !== registeredDirectory) {
                return false;
            }
            else {
                return true;
                // to be implemented delete resource from computer if the software is run on unauthorized device.
            }
        }
        catch (err) {
            if (err.code === "ENOENT") {
                console.log("no such folder");
            }
            return false;
        }
    }
}
exports.default = Security;
