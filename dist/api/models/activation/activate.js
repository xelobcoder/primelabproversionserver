"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeActivationRouter = exports.changeActivationStatus = void 0;
const helper_js_1 = require("./../../../helper.js");
async function changeActivationStatus(data) {
    let q_query = "UPDATE new_patients SET activation_status = ?";
    const { patientid, action, isbulk = false } = data;
    if (!patientid || !action) {
        throw new Error("patientid and action event required");
    }
    if (["TRUE", "FALSE"].includes(action) === false) {
        throw new Error("FALSE || TRUE required");
    }
    if (!isbulk && typeof isbulk == "boolean") {
        q_query += " WHERE patientid = ?";
    }
    return (0, helper_js_1.rowAffected)(await (0, helper_js_1.promisifyQuery)(q_query, [action, patientid]));
}
exports.changeActivationStatus = changeActivationStatus;
async function changeActivationRouter(request, response) {
    try {
        const requestQuery = request.query;
        const status = await changeActivationStatus(requestQuery);
        response.send({ status });
    }
    catch (err) {
        response.send({ status: false });
    }
}
exports.changeActivationRouter = changeActivationRouter;
