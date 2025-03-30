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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../../logger"));
const helper_1 = require("../../helper");
const configuration_1 = __importDefault(require("../../helpers/configuration"));
const security_1 = __importDefault(require("../../api/models/security/security"));
const queries = __importStar(require("./queries"));
class User {
    constructor(name, password, role, email, branch) {
        this.name = name;
        this.password = password;
        this.role = role;
        this.email = email;
        this.branch = branch;
    }
    async checkUserExist() {
        const result = await (0, helper_1.promisifyQuery)(queries.SELECT_ROLE_BY_EMAIL, [this.email]);
        return result.length !== 0;
    }
    async hashPassword() {
        const salt = await bcrypt_1.default.genSalt(10);
        this.password = await bcrypt_1.default.hash(this.password, salt);
        return this.password;
    }
    async isPasswordSame(password, hashpassword) {
        return await bcrypt_1.default.compare(password, hashpassword);
    }
    async insertionOne(name, password) {
        if (!this.branch) {
            throw new Error("User must be assigned a branch");
        }
        const parsedBranch = parseInt(this.branch.toString());
        if (isNaN(parsedBranch)) {
            throw new TypeError("branch must be an integer");
        }
        return (0, helper_1.promisifyQuery)(queries.INSERT_USER, [name, password, this.role, this.email, this.branch]);
    }
    async getUserData(email) {
        try {
            const result = await (0, helper_1.promisifyQuery)(queries.SELECT_USER_BY_EMAIL, [email]);
            if (result.length === 0)
                return false;
            return result[0];
        }
        catch (err) {
            logger_1.default.error(err);
            return false;
        }
    }
    async getUserDataById(employeeid) {
        try {
            const result = await (0, helper_1.promisifyQuery)(queries.SELECT_USERDATA_BY_EMPLOYEE_ID, [employeeid]);
            return result;
        }
        catch (err) {
            logger_1.default.error(err);
            return false;
        }
    }
    async processUserData(data) {
        const user = (0, helper_1.convertKeysToLowerCase)(data);
        const { permissions, email, activation, username, role, employeeid, branch } = user;
        if (activation !== 1) {
            return `Access Denied!!. User not activated to have access`;
        }
        if (permissions === "{}") {
            return `Access Denied!!. Permissions not set`;
        }
        if (configuration_1.default.configurations.strictBranchCheck) {
            if (!branch || branch <= 0) {
                return "Access Denied!!.User not assigned to a branch";
            }
        }
        let branchname = null;
        if (branch) {
            const branchData = await (0, helper_1.promisifyQuery)(queries.SELECT_BRANCH_NAME_BY_ID, [parseInt(branch)]);
            if (branchData.length > 0) {
                branchname = branchData[0]["name"];
            }
        }
        return { permissions, role, activation, email, employeeid, username, branchid: branch, branch: branchname };
    }
    async createUser() {
        try {
            const isUserExist = await this.checkUserExist();
            if (isUserExist)
                return "user already exist";
            const hashPassword = await this.hashPassword();
            return await this.insertionOne(this.name, hashPassword);
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error((err === null || err === void 0 ? void 0 : err.message) || "error creating user");
        }
    }
    async checkLogins(email, password) {
        var _a;
        try {
            const storedPassword = await (0, helper_1.promisifyQuery)(queries.SELECT_USER_BY_EMAIL, [email]);
            if (storedPassword.length === 0)
                return false;
            return await bcrypt_1.default.compare(password, (_a = storedPassword[0]) === null || _a === void 0 ? void 0 : _a.password);
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error((err === null || err === void 0 ? void 0 : err.message) || "something went wrong");
        }
    }
    async applicationAccessToken() {
        return jsonwebtoken_1.default.sign({ clientid: 74747 }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1y" });
    }
    async createAccessTokenCredentials(accesskey, email, data, expiresIn) {
        try {
            const accessToken = jsonwebtoken_1.default.sign(Object.assign({}, data), accesskey, { expiresIn });
            return accessToken;
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error((err === null || err === void 0 ? void 0 : err.message) || "something went wrong");
        }
    }
    async validateRequestToken(req, res, next, accessSecret) {
        try {
            const accessToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
            if (!accessToken) {
                return (0, helper_1.customError)("Unauthorized to access service.", 401, res);
            }
            const isValidated = await this.verifyToken(accessToken);
            if (isValidated) {
                next();
            }
        }
        catch (err) {
            return (0, helper_1.customError)("Application license expired, please contact admin for renewal", 401, res);
        }
    }
    async validateEmployeeToken(request, response) {
        try {
            const { token } = request.query;
            if (!token) {
                return (0, helper_1.customError)("token not provided", 404, response);
            }
            const tokenValid = await jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!tokenValid) {
                return (0, helper_1.customError)("token provided is invalid", 401, response);
            }
            const { role, employeeid } = tokenValid;
            const isUserLoggedIn = await new security_1.default(employeeid).getCanInitiateLogin();
            if (isUserLoggedIn) {
                return response.send({ loggedIn: false, message: "user is not loggedIn" });
            }
            if (!role) {
                return (0, helper_1.customError)("token is invalid", 404, response);
            }
            switch (role) {
                case "clinician":
                case "patient":
                    response.send({ statusCode: 200, status: "success", user: tokenValid });
                    break;
                default:
                    const allValid = ["username", "activation", "email", "employeeid", "permissions", "role"].some((item) => !tokenValid.hasOwnProperty(item));
                    if (allValid) {
                        return (0, helper_1.customError)("invalid token data received", 401, response);
                    }
                    let branch = await (0, helper_1.promisifyQuery)(queries.SELECT_BRANCH_NAME_BY_ID, [parseInt(tokenValid === null || tokenValid === void 0 ? void 0 : tokenValid.branchid)]);
                    if (branch.length > 0) {
                        branch = branch[0]["name"];
                    }
                    response.send({ statusCode: 200, status: "success", user: Object.assign(Object.assign({}, tokenValid), { branch }) });
            }
        }
        catch (err) {
            return (0, helper_1.customError)("Expired token", 404, response);
        }
    }
    async verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
    }
    async tokenizeData(data, expiresIn) {
        return jsonwebtoken_1.default.sign(Object.assign({}, data), process.env.ACCESS_TOKEN_SECRET, { expiresIn });
    }
    async getUserRole(employeeid) {
        const data = await (0, helper_1.promisifyQuery)(queries.SELECT_ROLE_BY_EMPLOYEE_ID, [employeeid]);
        return data.length > 0 ? data[0]["role"] : null;
    }
    async userExistWithId(id) {
        try {
            const result = await (0, helper_1.promisifyQuery)(queries.SELECT_USER_BY_EMPLOYEE_ID, [id]);
            return result.length === 0 ? false : result;
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error((err === null || err === void 0 ? void 0 : err.message) || "something went wrong");
        }
    }
}
exports.default = User;
