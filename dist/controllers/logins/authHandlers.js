"use strict";
// src/authHandlers.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateClinician = exports.updatePermissions = exports.getUserPermissions = exports.activateUser = exports.authenticateUser = exports.updateBasicInfo = exports.deleteAccountHandler = exports.createAccount = exports.getUser = exports.getLogins = void 0;
const helper_1 = require("../../helper");
const createAccount_1 = require("../LobnosAuth/createAccount");
const user_1 = __importDefault(require("../LobnosAuth/user"));
const logger_1 = __importDefault(require("../../../logger"));
const getLogins = async (req, res) => {
    (0, createAccount_1.getAllLogins)(req, res);
};
exports.getLogins = getLogins;
const getUser = async (req, res) => {
    (0, createAccount_1.getAUser)(req, res);
};
exports.getUser = getUser;
const createAccount = async (req, res) => {
    (0, createAccount_1.createNewAccount)(req, res);
};
exports.createAccount = createAccount;
const deleteAccountHandler = async (req, res) => {
    (0, createAccount_1.deleteAccount)(req, res);
};
exports.deleteAccountHandler = deleteAccountHandler;
const updateBasicInfo = async (req, res) => {
    (0, createAccount_1.updateUserBasicInfo)(req, res);
};
exports.updateBasicInfo = updateBasicInfo;
const authenticateUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        (0, helper_1.customError)("Bad Request", 400, res);
        return;
    }
    (0, createAccount_1.userLogin)(req, res);
};
exports.authenticateUser = authenticateUser;
const activateUser = async (req, res) => {
    (0, createAccount_1.activateAUser)(req, res);
};
exports.activateUser = activateUser;
const getUserPermissions = async (req, res) => {
    const { permissions } = req.query;
    if (!permissions) {
        (0, helper_1.customError)("employeeid permission id required", 404, res);
        return;
    }
    const result = await (0, createAccount_1.getPermissions)(permissions, res);
    res.send(result);
};
exports.getUserPermissions = getUserPermissions;
const updatePermissions = async (req, res) => {
    (0, createAccount_1.updateUserPermission)(req, res);
};
exports.updatePermissions = updatePermissions;
const authenticateClinician = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            (0, helper_1.customError)("email and password required", 404, res);
            return;
        }
        const query = `SELECT * FROM clinicianscredentials WHERE email = ?`;
        const getUserDetails = await (0, helper_1.promisifyQuery)(query, [email]);
        if (getUserDetails.length === 0) {
            (0, helper_1.customError)("Invalid credentials seen", 404, res);
            return;
        }
        const { ispasswordUpdated, clinicianid } = getUserDetails[0];
        const data = { role: "clinician", email, employeeid: clinicianid };
        if (ispasswordUpdated === 0 && getUserDetails[0]["password"] === password) {
            const token = await new user_1.default().tokenizeData(data, "40m");
            res.send({ message: "Clinician authenticated", statusCode: 200, status: "success", token, result: data });
            return;
        }
        if (ispasswordUpdated === 0 && getUserDetails[0]["password"] !== password) {
            res.send({ message: "Invalid user credentials", statusCode: 200, status: "fail" });
            return;
        }
        if (ispasswordUpdated === 1) {
            const isMatched = new user_1.default().isPasswordSame(password, getUserDetails[0]["password"]);
            isMatched
                ? res.send({ message: "password authenticated", statusCode: 200, status: "success", result: getUserDetails[0] })
                : res.send({ message: "Invalid user credentials", statusCode: 200, status: "error" });
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        (0, helper_1.customError)("Something wrong has occurred", 404, res);
    }
};
exports.authenticateClinician = authenticateClinician;
