"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_1 = require("../../../helper");
const partitioning_1 = __importDefault(require("../billing/partitioning"));
/**
 * Class representing operations related to billing and test management.
 */
class Operations {
    /**
     * Creates an instance of Operations.
     * @param {number} billingid - The billing ID associated with this instance.
     */
    constructor(billingid) {
        /**
         * Initiates test processing for a given test ID and billing ID.
         * @param {number} testid - The test ID.
         * @param {number} billingid - The billing ID.
         * @returns {Promise<number>} - A promise that resolves to the number of rows affected.
         */
        this.initiateTestProcessing = async (testid, billingid) => {
            const is_updated = await (0, helper_1.promisifyQuery)(queries_1.q_startProcessingTest, [billingid, testid]);
            return (0, helper_1.rowAffected)(is_updated);
        };
        /**
         * Logs result entry for a given test ID and billing ID.
         * @param {number} testid - The test ID.
         * @param {number} billingid - The billing ID.
         * @returns {Promise<number>} - A promise that resolves to the number of rows affected.
         */
        this.logResultEntry = async (testid, billingid) => {
            const isResultEntryLogged = await (0, helper_1.promisifyQuery)(queries_1.q_log_result_entry, [billingid, testid]);
            return (0, helper_1.rowAffected)(isResultEntryLogged);
        };
        /**
         * Retrieves a preview of all tests for a given billing ID.
         * @param {number} billingid - The billing ID.
         * @returns {Promise<any[]>} - A promise that resolves to the list of test previews.
         */
        this.getAllTestPreview = async function (billingid) {
            try {
                if (billingid) {
                    const alltest = await (0, helper_1.promisifyQuery)(queries_1.q_get_all_test_preview, [billingid]);
                    return alltest;
                }
            }
            catch (error) {
                throw error;
            }
        };
        this.billingid = billingid;
    }
    /**
     * Checks if the billing ID is valid.
     * @returns {Promise<boolean>} - A promise that resolves to true if the billing ID is valid, otherwise false.
     */
    async isvalidBillingid() {
        const result = await (0, helper_1.promisifyQuery)(queries_1.q_checkbillingid, [this.billingid]);
        return result.length === 0;
    }
    /**
     * Checks if the billing ID is ready for test processing.
     * @returns {Promise<boolean | string>} - A promise that resolves to true if the billing ID is ready, false if not, or an error message if invalid.
     */
    async readyforTest() {
        const validId = await this.isvalidBillingid();
        if (!validId) {
            return "Invalid billingid";
        }
        if (validId) {
            const result = await (0, helper_1.promisifyQuery)(queries_1.q_approved_samples, [this.billingid]);
            return !(result.length === 0);
        }
    }
    /**
     * Retrieves laboratory tests ready for result entry based on the department ID.
     * @param {number | string} departmentid - The department ID to filter by.
     * @returns {Promise<[] | string>} - A promise that resolves to the list of laboratory tests ready for result entry or a failure message.
     * @throws {Error} - Throws an error if the department ID is not provided or in the wrong format.
     */
    async getLaboratoryTestReadyForResultEntry(departmentid) {
        const certified = await this.readyforTest();
        if (!certified)
            return "billingid  not ready for result entry" /* OperationsFailures.notready */;
        if (!departmentid || (typeof departmentid == "string" && departmentid != "all")) {
            throw new Error("departmentid not provided or wrong format provided");
        }
        const values = [];
        let queryString = queries_1.q_billing_test_collection;
        if (typeof departmentid == "number") {
            queryString += ` AND tp.category =  ?`;
            values.push(departmentid);
        }
        queryString += ` AND ta.collection = 'true' AND ta.ready='false'  AND d.department <> 'ultrasound' `;
        return await (0, helper_1.promisifyQuery)(queryString, values);
    }
    /**
     * Retrieves all qualified tests to process by department.
     * @param {number | string} category - The category to filter by.
     * @param {number} count - The number of results per page.
     * @param {number} page - The page number.
     * @returns {Promise<[]>} - A promise that resolves to the list of qualified tests.
     */
    async getAllQualifiedToProcessByDepartment(category, count, page) {
        try {
            let queryString = queries_1.q_qualifiedToProcessByDepartment;
            const values = [];
            if (category != "all") {
                queryString += ` AND tp.category = ?`;
                values.push(category);
            }
            values.push(count);
            values.push(page - 1 * count);
            queryString += ` AND ta.collection = 'true' AND ta.ready='false' AND d.department <> 'ultrasound' 
      GROUP BY np.patientid ORDER BY b.billingid ASC LIMIT ? OFFSET ?`;
            return await (0, helper_1.promisifyQuery)(queryString, values);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Retrieves all cases for result entry based on various filters.
     * @param {OperationsFilterResultEntry} requestQuery - The query parameters for filtering.
     * @returns {Promise<any[]>} - A promise that resolves to the list of cases.
     * @throws {Error} - Throws an error if the query fails.
     */
    async getAllCasesResultEntryByMany(requestQuery) {
        const { fullname, count = 10, page = 1, departmentid, testid, status, from, to, billingid } = requestQuery;
        try {
            let finalQuery;
            const values = [];
            const conditions = [];
            const hasDuration = from && to;
            const providedFrom = new Date(from);
            const providedTo = new Date(to);
            const hasSameMonth = providedFrom.getMonth() === providedTo.getMonth();
            const hasSameYear = providedFrom.getFullYear() === providedTo.getFullYear();
            function getPartitionTableName(baseName, currentDate = new Date()) {
                const year = currentDate.getFullYear();
                const month = `${currentDate.getMonth() + 1}`.padStart(2, "0");
                return `${baseName}_${year}_${month}`;
            }
            if (hasDuration && !(hasSameMonth && hasSameYear)) {
                let billingPartitions = await new partitioning_1.default("billing", "billing").TablePartitionPrunner(from, to);
                let testAscensionsPartions = await new partitioning_1.default("test_ascension", "asc").TablePartitionPrunner(from, to);
                const canMove = typeof billingPartitions === "string" && typeof testAscensionsPartions === "string";
                if (canMove) {
                    const query = queries_1.q_get_all_result_entry_partitioning
                        .replace("{billing_table}", billingPartitions)
                        .replace("{asc_table}", testAscensionsPartions);
                    finalQuery = query;
                }
                else {
                    finalQuery = queries_1.q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
                }
            }
            else if (hasDuration && hasSameMonth && hasSameYear) {
                const billingTable = getPartitionTableName("billing");
                const ascTable = getPartitionTableName("asc");
                const query = queries_1.q_get_all_result_entry_partitioning.replace("{billing_table}", billingTable).replace("{asc_table}", ascTable);
                finalQuery = query;
            }
            else {
                finalQuery = queries_1.q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
            }
            if (fullname) {
                conditions.push(`CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) LIKE ?`);
                values.push(`${fullname}%`);
            }
            if (departmentid && departmentid !== "all") {
                conditions.push(`tp.category = ?`);
                values.push(departmentid);
            }
            if (status === "completed") {
                conditions.push(`ta.ready = 'true'`);
            }
            else if (status === "pending") {
                conditions.push(`ta.ready = 'false'`);
            }
            if (testid && !isNaN(testid)) {
                conditions.push(`ta.testid = ?`);
                values.push(testid);
            }
            if (from && to) {
                conditions.push(`DATE(b.billedon) BETWEEN ? AND ?`);
                values.push(from, to);
            }
            else if (from) {
                conditions.push(`DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`);
                values.push(from);
            }
            if (billingid) {
                conditions.push(`b.billingid = ?`);
                values.push(billingid);
            }
            if (conditions.length > 0) {
                finalQuery += ` AND ${conditions.join(" AND ")} `;
            }
            finalQuery += `
      ORDER BY b.billingid DESC
      LIMIT ? OFFSET ?
    `;
            return await (0, helper_1.paginationQuery)({ count, page }, finalQuery, values);
        }
        catch (err) {
            throw err;
        }
    }
    /**
     *
     */
    async getBillCompletedTest(billingid) {
        if (billingid) {
            const test_outcome = await (0, helper_1.promisifyQuery)(queries_1.q_entered_result_part, [billingid]);
            return test_outcome;
        }
    }
    /**
     * Retrieves all entered results based on various filters.
     * @param {resultQuery} data - The query parameters for filtering.
     * @returns {Promise<any[]>} - A promise that resolves to the list of entered results.
     * @throws {Error} - Throws an error if the query fails.
     */
    async getAllEnterResult(data) {
        try {
            const { from, to, patientid, billingid, fullname, sortingwise, count, page } = data;
            let queryString = queries_1.q_get_all_entered_result;
            const conditions = [];
            const values = [];
            conditions.push(`ss.approvalstatus = 1 AND d.department <> 'ultrasound'`);
            if (from && !to) {
                conditions.push(`DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`);
                values.push(from);
            }
            else if (from && to) {
                conditions.push(`DATE(b.billedon) BETWEEN ? AND ?`);
                values.push(from, to);
            }
            if (patientid) {
                conditions.push(`np.PATIENTID = ?`);
                values.push(patientid);
            }
            if (billingid) {
                conditions.push(`b.billingid = ?`);
                values.push(billingid);
            }
            if (fullname) {
                conditions.push(`CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) LIKE ?`);
                values.push(`${fullname}%`);
            }
            if (conditions.length > 0) {
                queryString += ` WHERE ${conditions.join(" AND ")}`;
            }
            queryString += ` GROUP BY b.billingid`;
            queryString += ` ORDER BY ta.id DESC`;
            queryString += ` LIMIT ? OFFSET ?`;
            return await (0, helper_1.paginationQuery)({ page, count }, queryString, values);
        }
        catch (err) {
            console.log(err);
        }
    }
    /**
     * Retrieves the ultrasound waiting list with pagination.
     * @param {object} data - The pagination parameters.
     * @param {number} data.count - The number of results per page.
     * @param {number} data.page - The page number.
     * @returns {Promise<any[]>} - A promise that resolves to the list of ultrasound waiting items.
     */
    async getUltrasoundWaitingList(data) {
        const { count = 10, page = 1 } = data;
        const result = await (0, helper_1.paginationQuery)({ count, page }, queries_1.q_ultrasound_waitingList);
        return result;
    }
    /**
     * Retrieves the processed scan list based on various filters.
     * @param {ProcessedScan} data - The query parameters for filtering.
     * @returns {Promise<any[]>} - A promise that resolves to the list of processed scans.
     * @throws {Error} - Throws an error if the query fails.
     */
    async processedScanList(data) {
        try {
            const { from, to, search, count = 10, page = 1 } = data;
            const values = [];
            const conditions = [`d.department = 'ultrasound'`, `ta.ready = 'true'`];
            if (from) {
                conditions.push(`DATE(b.billedon) BETWEEN ? AND ?`);
                values.push(from, to || "CURRENT_DATE");
            }
            if (search) {
                conditions.push(`(CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) LIKE ? OR np.MOBILE_NUMBER = ?)`);
                values.push(`%${search}%`, search);
            }
            let whereClause = "";
            if (conditions.length > 0) {
                whereClause = "WHERE " + conditions.join(" AND ");
            }
            const query = queries_1.q_ultrasound_processed_list;
            values.unshift(whereClause);
            return await (0, helper_1.paginationQuery)({ count, page }, query, values);
        }
        catch (err) {
            throw new Error(err);
        }
    }
}
exports.default = Operations;
