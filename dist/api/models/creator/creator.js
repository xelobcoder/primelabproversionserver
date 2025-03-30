"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../../helper");
const list_1 = require("../../testpanel/list");
const appset_1 = __importDefault(require("../application/appsettings/appset"));
const operations_1 = __importDefault(require("../operations/operations"));
const queries_1 = require("./queries");
const registration_1 = __importDefault(require("../registration/registration"));
class Creator {
    constructor(testid) {
        this.testid = testid;
    }
    async getTestCreationRule() {
        if (!this.testid)
            throw new Error("testid is required");
        const rule = await (0, helper_1.promisifyQuery)(queries_1.testCreationRule, [this.testid]);
        if (rule.length > 0 && rule[0].creationrule !== "{}") {
            const result = JSON.parse(rule[0].creationrule);
            return result;
        }
        return [];
    }
    async getPreviousRecords(testname, billingid, patientid) {
        const tablename = list_1.testpanel.generatedTestTableName(testname);
        const previousRecords = await (0, helper_1.promisifyQuery)(`SELECT * FROM ${tablename} WHERE billingid = ? AND patientid = ?`, [
            billingid,
            patientid,
        ]);
        return previousRecords;
    }
    async getResultEntryTest(scvid, ptid, target) {
        if (typeof target == "string")
            target = target.split(",");
        const patientid = parseInt(ptid.slice(target[1]));
        const billingid = parseInt(scvid.slice(target[0]));
        const patientdata = await new registration_1.default().getPatientBasicData(patientid);
        if (patientdata.length === 0) {
            throw new Error("patient not found.");
        }
        const collection = await (0, helper_1.promisifyQuery)(queries_1.q_get_test_ascension_name_and_id, [billingid]);
        if (collection.length > 0) {
            return { personal_data: patientdata.slice(0, 1), test: collection || [] };
        }
        return { personal_data: patientdata || {}, test: collection || [] };
    }
    async getCustomPreviousRecords(testid, billingid, patientid) {
        try {
            const testname = await list_1.testpanel.getTestUsingTestid(testid);
            if (testname === false) {
                throw new Error("wrong testid provided");
            }
            const previousRecords = await this.getPreviousRecords(testname, billingid, patientid);
            if (previousRecords.length > 0 && previousRecords.some((item) => item.field === "ultrasound")) {
                return previousRecords[0];
            }
            let result = await this.getTestCreationRule();
            const hasGenderVariation = result.length > 0 && result.some((item) => item.hasGenderVariation === true);
            let clientGender = "";
            if (hasGenderVariation) {
                const packet = await (0, helper_1.promisifyQuery)(queries_1.getGenderQuery, [patientid]);
                if (packet.length > 0)
                    clientGender = packet[0]["gender"];
            }
            if (previousRecords.length === 0)
                return result;
            result = result.map((item) => {
                const { name } = item;
                const matched = previousRecords.find((u) => u.field === name);
                return matched ? Object.assign(Object.assign({}, item), { value: matched.value }) : item;
            });
            if (hasGenderVariation && clientGender) {
                result = result.map((item) => {
                    const obj = Object.assign({}, item);
                    if (item[clientGender]) {
                        obj.upperlimit = item[clientGender].upperlimit;
                        obj.lowerlimit = item[clientGender].lowerlimit;
                        delete obj.female;
                        delete obj.male;
                    }
                    return obj;
                });
            }
            return result;
        }
        catch (err) {
            throw err;
        }
    }
    async getCustomCommentsRecords(billingid, testid) {
        if (!billingid || !testid) {
            throw new Error("testid and billingid required");
        }
        let comments = await (0, helper_1.promisifyQuery)(queries_1._comments_query, [billingid, testid]);
        return comments.length > 0 ? comments[0]["comments"] : "";
    }
    async updateTestCreationRule(data) {
        if (!this.testid || !data)
            throw new Error("testid and data is required");
        const stringdata = JSON.stringify(data);
        const isUpdated = await (0, helper_1.promisifyQuery)(queries_1.update_creation_query, [stringdata, this.testid]);
        return (0, helper_1.rowAffected)(isUpdated);
    }
    async sanitize_patientid_billingid_query(csvid, ptid, target) {
        if (typeof target != "string" && !Array.isArray(target))
            throw new TypeError("Array or string separated by delimeter , required");
        let splitter = target;
        if (typeof target == "string") {
            splitter = target.split(",");
        }
        const ptsplitter = parseInt(splitter[1]);
        const blsplitter = parseInt(splitter[0]);
        let patientid = ptid.slice(ptsplitter);
        let billingid = csvid.slice(blsplitter);
        if (!isNaN(patientid) && !isNaN(billingid)) {
            patientid = parseInt(patientid);
            billingid = parseInt(billingid);
        }
        return { patientid, billingid };
    }
    async resultEntry(request, response) {
        const { csvid, ptid, testid, fields, employeeid, comments, isScan } = request.body;
        if (!csvid || !ptid || !testid || !fields) {
            return (0, helper_1.customError)("billingid, patientid, testid,test and fields are required", 400, response);
        }
        if (fields.length == 0) {
            return (0, helper_1.customError)("Field length must not be 0", 400, response);
        }
        let { billingid, patientid } = await this.sanitize_patientid_billingid_query(csvid, ptid, "70,50");
        if (typeof billingid != "number" || typeof patientid != "number") {
            return (0, helper_1.customError)(`patientid and billingid must be type number`, 400, response);
        }
        const testname = await list_1.testpanel.getTestUsingTestid(testid);
        const tablename = list_1.testpanel.generatedTestTableName(testname).toLowerCase();
        const shouldCreateRecord = async function (billingid, patientid, testtable, field) {
            const records = await (0, helper_1.promisifyQuery)(`SELECT * FROM ${testtable} WHERE billingid = ? AND field = ? AND patientid = ?`, [
                billingid,
                field,
                patientid,
            ]);
            return records.length === 0;
        };
        let ascensionQuery = `UPDATE test_ascension SET ready = 'true', ready_date = NOW()`;
        const isApprovalTrue = await new appset_1.default().isApprovalSetTrue();
        if (isApprovalTrue === false) {
            ascensionQuery += `,ApprovalStatus = 1`;
        }
        ascensionQuery += ` WHERE billingid = ? AND testid = ?`;
        const insertUpdate = async function () {
            const insertAll = await Promise.all(fields.map(async (item, index) => {
                if (await shouldCreateRecord(billingid, patientid, tablename, item.field)) {
                    const values = [item.field, billingid, patientid, item.value, employeeid, item === null || item === void 0 ? void 0 : item.entrymode];
                    const query = `INSERT INTO ${tablename} (field,billingid,patientid,value,employeeid,entrymode) VALUES(?,?,?,?,?,?)`;
                    await new operations_1.default(billingid).initiateTestProcessing(testid, billingid);
                    await (0, helper_1.promisifyQuery)(ascensionQuery, [billingid, testid]);
                    return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, values));
                }
                else {
                    const updateRecords = `UPDATE ${tablename} SET value = ?,updatedon =Now(),employeeid = ?,entrymode = ? WHERE patientid = ? AND billingid = ? AND field = ?`;
                    const result = await (0, helper_1.promisifyQuery)(updateRecords, [item.value, employeeid, item === null || item === void 0 ? void 0 : item.entrymode, patientid, billingid, item.field]);
                    return (0, helper_1.rowAffected)(result);
                }
            }));
            const isAllInserted = insertAll.some((a, i) => a == false);
            const pushCommentsQuery = `UPDATE result_comments SET COMMENTS = ? WHERE BILLINGID = ? AND TESTID = ?`;
            const commentSection = async function () {
                const isRecordAvailable = await (0, helper_1.promisifyQuery)(`SELECT * FROM result_comments WHERE testid = ? AND billingid = ?`, [
                    testid,
                    billingid,
                ]);
                if (isRecordAvailable.length > 0) {
                    return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(pushCommentsQuery, [comments, billingid, testid]));
                }
                else {
                    return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(`INSERT INTO RESULT_COMMENTS (TESTID,BILLINGID,COMMENTS) VALUES (?,?,?)`, [testid, billingid, comments]));
                }
            };
            const isCommented = await commentSection();
            if (isAllInserted === false && isCommented) {
                response.send({ status: "success", statusCode: 200, message: "records updated successfully" });
            }
            else {
                response.send({ status: "failed", statusCode: 404, message: "error occured saving results" });
            }
        };
        await insertUpdate();
    }
}
exports.default = Creator;
