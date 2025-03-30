"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../logger"));
const helper_1 = require("../../../helper");
const creator_1 = __importDefault(require("../creator/creator"));
const registration_1 = __importDefault(require("../registration/registration"));
const list_1 = require("../../testpanel/list");
const queries_1 = require("./queries");
const emptySummry = [
    { title: "registered clients", value: 0 },
    { title: "test count", value: 0 },
    { title: "samples collected", value: 0 },
    { title: "processed test", value: 0 },
    { title: "test ready", value: 0 },
    { title: "Approved test", value: 0 },
];
/**
 * Class representing ResultPrint with various methods to handle print-related functionalities.
 */
class ResultPrint {
    constructor(billingid) {
        this.billingid = billingid;
    }
    /**
     * Retrieves printable test results based on query parameters.
     * @param {Object} requestquery - The query parameters from the request.
     * @returns {Promise<Array>} - The list of printable test results.
     */
    async get_printables(requestquery) {
        const { querydate, content } = requestquery;
        let { query, params } = (0, queries_1.modelQueryWithFilters)(querydate, content);
        const printables = await (0, helper_1.promisifyQuery)(query, params);
        return printables;
    }
    /**
     * Retrieves extra information about a test.
     * @param {number} id - The billingid.
     * @returns {Promise<any[]>} - The extra information about the test.
     */
    async get_extrainfo_test(id) {
        const result = await (0, helper_1.promisifyQuery)(queries_1.extrainfoTestQuery, [id]);
        return result;
    }
    /**
     * Updates the print count for a test.
     * @param {number} id - The ID of the test.
     * @param {number} count - The new print count.
     * @throws Will throw an error if id or count is not provided.
     */
    async updatePrintCount(id, count) {
        if (!id || !count) {
            throw new Error("test ascension id and count required");
        }
        const result = await (0, helper_1.promisifyQuery)(queries_1.updatePrintCountQuery, [count, id]);
        return result;
    }
    /**
     * Retrieves the result entry scientist's username and the username of the person who validated the result.
     * @param {number} billingid - The billing ID.
     * @param {number} testid - The test ID.
     * @returns {Promise<{ resultentry: string | null; validatedBy: string | null }>} - The usernames of the result entry scientist and the validator.
     * @throws Will throw an error if billingid or testid is not provided.
     */
    async getResultEntryScientist(billingid, testid) {
        try {
            if (!billingid || !testid) {
                throw new Error("billingid and testid are required");
            }
            let testname = null;
            const testnameResult = await (0, helper_1.promisifyQuery)(`SELECT * FROM test_panels WHERE id = ?`, [testid]);
            if (testnameResult.length > 0) {
                testname = testnameResult[0]["name"];
            }
            if (!testname) {
                throw new Error("wrong testid provided");
            }
            const tablename = list_1.testpanel.generatedTestTableName(testname);
            const getEmployeeid = await (0, helper_1.promisifyQuery)(`SELECT employeeid FROM \`${tablename}\` WHERE billingid = ?`, [billingid]);
            let employeeid = null;
            if (getEmployeeid.length > 0) {
                employeeid = getEmployeeid[0]["employeeid"];
            }
            let username = null;
            const usernameResult = await (0, helper_1.promisifyQuery)(queries_1.approvedByUsernameQuery, [employeeid]);
            if (usernameResult.length > 0) {
                username = usernameResult[0]["username"];
            }
            let approvedBy = null;
            const approvedByResult = await (0, helper_1.promisifyQuery)(queries_1.approvedByQuery, [billingid, testid]);
            if (approvedByResult.length > 0) {
                approvedBy = approvedByResult[0]["ApprovedBy"];
                const approvedByUsernameResult = await (0, helper_1.promisifyQuery)(queries_1.usernameQuery, [approvedBy]);
                if (approvedByUsernameResult.length > 0) {
                    approvedBy = approvedByUsernameResult[0]["username"];
                }
            }
            return { resultentry: username, validatedBy: approvedBy };
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Retrieves summary information for the ready page based on query parameters.
     * @param {Object} requestquery - The query parameters
     * @returns {Promise<void>}
     */
    async get_summary_ready_page(requestquery) {
        var _a;
        const { querydate } = requestquery;
        function getTodayDate() {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, "0");
            const day = String(currentDate.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        try {
            const result = await (0, helper_1.promisifyQuery)(queries_1.summaryReadyPageQuery, [querydate || getTodayDate(), querydate || getTodayDate()]);
            if (result && result.length > 0) {
                const processing = result.filter((item) => {
                    return item.processing === "true" && item.collection === "true" && item.ready === "true";
                }).length;
                const ready = result.filter((item) => {
                    return item.processing === "true" && item.ready === "true";
                }).length;
                const collection = result.filter((item) => {
                    return item.collection === "true";
                }).length;
                const approval = result.filter((item) => {
                    return item.ApprovalStatus === 1;
                }).length;
                const testcount = result.length;
                return [
                    { title: "registered clients", value: (_a = result[0]) === null || _a === void 0 ? void 0 : _a["registered"] },
                    { title: "test count", value: testcount },
                    { title: "samples collected", value: collection },
                    { title: "processed test", value: processing },
                    { title: "test ready", value: ready },
                    { title: "Approved test", value: approval },
                ];
            }
            else {
                return emptySummry;
            }
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Retrieves sampling information for a test.
     * @param {number} billing - The billing ID.
     * @param {number} testid - The test ID.
     * @returns {Promise<any>} - The sampling information.
     */
    async getSamplingInformation(billing, testid) {
        try {
            let sampling = await (0, helper_1.promisifyQuery)(queries_1.samplingQuery, [billing, testid]);
            if (sampling.length === 0)
                return {};
            sampling = sampling.map((item) => {
                const processing_time = new Date(item === null || item === void 0 ? void 0 : item.processing_date).toLocaleTimeString();
                const collection_time = new Date(item === null || item === void 0 ? void 0 : item.collection_date).toLocaleTimeString();
                const ready_time = new Date(item === null || item === void 0 ? void 0 : item.ready_date).toLocaleTimeString();
                const processing_date = new Date(item === null || item === void 0 ? void 0 : item.processing_date).toLocaleDateString();
                const collection_date = new Date(item === null || item === void 0 ? void 0 : item.collection_date).toLocaleDateString();
                const ready_date = new Date(item === null || item === void 0 ? void 0 : item.ready_date).toLocaleDateString();
                return Object.assign(Object.assign({}, item), { processing_date, collection_date, ready_date, processing_time, collection_time, ready_time });
            });
            return sampling[0];
        }
        catch (err) {
            logger_1.default.error(err);
        }
    }
    /**
     * Retrieves comments for a test.
     * @param {number} billingid - The billing ID.
     * @param {number} testid - The test ID.
     * @param {Object} response - The response object.
     * @returns {Promise<any[]>} - The list of comments.
     */
    async getComments(billingid, testid, response) {
        try {
            const result = await (0, helper_1.promisifyQuery)(`SELECT * FROM result_comments WHERE BILLINGID = ? AND TESTID = ?`, [billingid, testid]);
            if (response) {
                response.send({ status: "success", statusCode: 200, result });
            }
            else {
                return result;
            }
        }
        catch (err) {
            logger_1.default.error(err);
            if (response) {
                (0, helper_1.customError)("error occured", 500, response);
            }
            else {
                throw new Error(err);
            }
        }
    }
    /**
     * Makes a decision on the result of a test (approve or decline).
     * @param {Object} requestbody - The request body containing the decision details.
     * @returns {Promise<number>} - The number of rows affected by the update.
     * @throws Will throw an error if the query fails.
     */
    async makeDecisionOnResult(requestbody) {
        const { billingid, testid, declineMessage, approvalstatus, actionPlan, approvedby } = requestbody;
        try {
            const queryResult = await (0, helper_1.promisifyQuery)(queries_1.makeDecisionOnResultQuery, [
                approvalstatus,
                actionPlan,
                declineMessage,
                approvedby,
                billingid,
                testid,
            ]);
            return (0, helper_1.rowAffected)(queryResult);
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Checks if a test has been approved.
     * @param {number} billingid - The billing ID.
     * @param {number} testid - The test ID.
     * @param {Object} response - The response object.
     * @returns {Promise<boolean>} - True if the test is approved, false otherwise.
     * @throws Will throw an error if the query fails.
     */
    async checkApproval(billingid, testid) {
        try {
            const result = await (0, helper_1.promisifyQuery)(queries_1.checkApprovalQuery, [billingid, testid]);
            if (result && result.length > 0) {
                const { approvalstatus } = result[0];
                return approvalstatus === 1;
            }
            return false;
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Performs an advanced search on tables with filters.
     * @param {Object} requestquery - The query parameters from the request.
     * @returns {Promise<any>} - The search results.
     * @throws Will throw an error if the query fails.
     */
    async advancedTablesSearch(requestquery) {
        try {
            const { values, query } = (0, queries_1.advancedTablesSearchQueryWithFilters)(requestquery);
            const { count, page } = requestquery;
            const result = await (0, helper_1.paginationQuery)({ count, page }, query, values);
            return result;
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Previews a report based on query parameters.
     * @param {Object} request - The request object.
     * @param {Object} response - The response object.
     * @returns {Promise<any[]>} - The report data.
     * @throws Will throw an error if the query fails.
     */
    async previewReport(request, response) {
        try {
            const { testid, billingid } = request.query;
            if (!testid || !billingid)
                return (0, helper_1.customError)("required query params missing", 400, response);
            let patientid = await new registration_1.default().getPatientInfoUsingBillingId(parseInt(billingid));
            if (patientid.length === 0)
                return (0, helper_1.customError)("patient not found", 404, response);
            patientid = patientid[0]["patientid"];
            const result = await new creator_1.default(testid).getCustomPreviousRecords(testid, billingid, patientid);
            return result;
        }
        catch (err) {
            throw err;
        }
    }
    /**
     * Retrieves approved test transactions for a billing ID.
     * @param {number} billingid - The billing ID.
     * @returns {Promise<any[]>} - The list of approved test transactions.
     * @throws Will throw an error if billingid is not provided or the query fails.
     */
    async getTransactionApprovedTest(billingid) {
        try {
            if (!billingid) {
                throw new Error("billingid is required");
            }
            const result = await (0, helper_1.promisifyQuery)(queries_1.transactionApprovedTestQuery, [billingid]);
            return result;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.default = ResultPrint;
