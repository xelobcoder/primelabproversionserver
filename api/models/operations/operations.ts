import {
  q_approved_samples,
  q_billing_test_collection,
  q_checkbillingid,
  q_entered_result_part,
  q_get_all_entered_result,
  q_get_all_result_entry_base,
  q_get_all_result_entry_partitioning,
  q_get_all_test_preview,
  q_log_result_entry,
  q_qualifiedToProcessByDepartment,
  q_startProcessingTest,
  q_ultrasound_processed_list,
  q_ultrasound_waitingList,
} from "./queries";
import { OperationsFailures, OperationsFilterResultEntry, ProcessedScan, resultQuery } from "./types";

import { promisifyQuery, paginationQuery, rowAffected } from "../../../helper";

import PartitionManager from "../billing/partitioning";

/**
 * Class representing operations related to billing and test management.
 */
export default class Operations {
  public billingid: number;

  /**
   * Creates an instance of Operations.
   * @param {number} billingid - The billing ID associated with this instance.
   */
  constructor(billingid: number) {
    this.billingid = billingid;
  }

  /**
   * Checks if the billing ID is valid.
   * @returns {Promise<boolean>} - A promise that resolves to true if the billing ID is valid, otherwise false.
   */
  async isvalidBillingid(): Promise<boolean> {
    const result = await promisifyQuery(q_checkbillingid, [this.billingid]);
    return result.length === 0;
  }

  /**
   * Checks if the billing ID is ready for test processing.
   * @returns {Promise<boolean | string>} - A promise that resolves to true if the billing ID is ready, false if not, or an error message if invalid.
   */
  async readyforTest(): Promise<boolean | string> {
    const validId = await this.isvalidBillingid();
    if (!validId) {
      return "Invalid billingid";
    }
    if (validId) {
      const result = await promisifyQuery(q_approved_samples, [this.billingid]);
      return !(result.length === 0);
    }
  }

  /**
   * Retrieves laboratory tests ready for result entry based on the department ID.
   * @param {number | string} departmentid - The department ID to filter by.
   * @returns {Promise<[] | string>} - A promise that resolves to the list of laboratory tests ready for result entry or a failure message.
   * @throws {Error} - Throws an error if the department ID is not provided or in the wrong format.
   */
  async getLaboratoryTestReadyForResultEntry(departmentid: number | string, branchid: number): Promise<[] | string> {
    const certified = await this.readyforTest();
    if (!certified) return OperationsFailures.notready;

    if (!departmentid || (typeof departmentid == "string" && departmentid != "all")) {
      throw new Error("departmentid not provided or wrong format provided");
    }

    const values = [];
    let queryString = q_billing_test_collection;

    if (typeof departmentid == "number") {
      queryString += ` AND tp.category =  ?`;
      values.push(departmentid);
    }

    queryString += ` AND ta.collection = 'true' AND ta.ready='false'  AND d.department <> 'ultrasound' `;
    return await promisifyQuery(queryString, values);
  }

  /**
   * Retrieves all qualified tests to process by department.
   * @param {number | string} category - The category to filter by.
   * @param {number} count - The number of results per page.
   * @param {number} page - The page number.
   * @returns {Promise<[]>} - A promise that resolves to the list of qualified tests.
   */
  // TODO: Refactor Code ,seems redundant to the above code
  public async getAllQualifiedToProcessByDepartment(category: number | string, count: number, page: number, branchid: number): Promise<[]> {
    try {
      let queryString = q_qualifiedToProcessByDepartment;
      const values = [];
      if (category != "all") {
        queryString += ` AND tp.category = ?`;
        values.push(category);
      }
      values.push(count);
      values.push(page - 1 * count);
      queryString += ` AND ta.collection = 'true' AND ta.ready='false' AND d.department <> 'ultrasound' 
      GROUP BY np.patientid ORDER BY b.billingid ASC LIMIT ? OFFSET ?`;
      return await promisifyQuery(queryString, values);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initiates test processing for a given test ID and billing ID.
   * @param {number} testid - The test ID.
   * @param {number} billingid - The billing ID.
   * @returns {Promise<number>} - A promise that resolves to the number of rows affected.
   */
  initiateTestProcessing = async (testid: number, billingid: number): Promise<number> => {
    const is_updated = await promisifyQuery(q_startProcessingTest, [billingid, testid]);
    return rowAffected(is_updated);
  };

  /**
   * Logs result entry for a given test ID and billing ID.
   * @param {number} testid - The test ID.
   * @param {number} billingid - The billing ID.
   * @returns {Promise<number>} - A promise that resolves to the number of rows affected.
   */
  logResultEntryIntoAscensionTable = async (testid: number, billingid: number): Promise<number> => {
    const isResultEntryLogged = await promisifyQuery(q_log_result_entry, [billingid, testid]);
    return rowAffected(isResultEntryLogged);
  };

  /**
   * Retrieves all cases for result entry based on various filters.
   * @param {OperationsFilterResultEntry} requestQuery - The query parameters for filtering.
   * @returns {Promise<any[]>} - A promise that resolves to the list of cases.
   * @throws {Error} - Throws an error if the query fails.
   */
  async getAllCasesResultEntryByMany(requestQuery: OperationsFilterResultEntry): Promise<any[]> {
    const { fullname, count = 10, page = 1, departmentid, testid, status, from, to, billingid,branchid} = requestQuery;

    try {
      let finalQuery: string;
      const values: any[] = [];
      const conditions: string[] = [];
      const hasDuration = from && to;
      const providedFrom = new Date(from);
      const providedTo = new Date(to);
      const hasSameMonth = providedFrom.getMonth() === providedTo.getMonth();
      const hasSameYear = providedFrom.getFullYear() === providedTo.getFullYear();

      function getPartitionTableName(baseName: string, currentDate = new Date()): string {
        const year = currentDate.getFullYear();
        const month = `${currentDate.getMonth() + 1}`.padStart(2, "0");
        return `${baseName}_${year}_${month}`;
      }

      if (hasDuration && !(hasSameMonth && hasSameYear)) {
        let billingPartitions = await new PartitionManager("billing", "billing").TablePartitionPrunner(from, to);
        let testAscensionsPartions = await new PartitionManager("test_ascension", "asc").TablePartitionPrunner(from, to);
        const canMove = typeof billingPartitions === "string" && typeof testAscensionsPartions === "string";

        if (canMove) {
          const query = q_get_all_result_entry_partitioning
            .replace("{billing_table}", billingPartitions)
            .replace("{asc_table}", testAscensionsPartions);
          finalQuery = query;
        } else {
          finalQuery = q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
        }
      } else if (hasDuration && hasSameMonth && hasSameYear) {
        const billingTable = getPartitionTableName("billing");
        const ascTable = getPartitionTableName("asc");
        const query = q_get_all_result_entry_partitioning.replace("{billing_table}", billingTable).replace("{asc_table}", ascTable);
        finalQuery = query;
      } else {
        finalQuery = q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
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
      } else if (status === "pending") {
        conditions.push(`ta.ready = 'false'`);
      }

      if (testid && !isNaN(testid)) {
        conditions.push(`ta.testid = ?`);
        values.push(testid);
      }

      if (from && to) {
        conditions.push(`DATE(b.billedon) BETWEEN ? AND ?`);
        values.push(from, to);
      } else if (from) {
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

      return await paginationQuery({ count, page }, finalQuery, values);
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   */
  public async getBillCompletedTest(billingid: number) {
    if (billingid) {
      const test_outcome = await promisifyQuery(q_entered_result_part, [billingid]);
      return test_outcome;
    }
  }

  /**
   * Retrieves all entered results based on various filters.
   * @param {resultQuery} data - The query parameters for filtering.
   * @returns {Promise<any[]>} - A promise that resolves to the list of entered results.
   * @throws {Error} - Throws an error if the query fails.
   */
  async getAllEnterResult(data: resultQuery): Promise<any[]> {
    try {
      const { from, to, patientid, billingid, fullname, sortingwise, count, page } = data;
      let queryString = q_get_all_entered_result;
      const conditions: string[] = [];
      const values: any[] = [];

      conditions.push(`ss.approvalstatus = 1 AND d.department <> 'ultrasound'`);

      if (from && !to) {
        conditions.push(`DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`);
        values.push(from);
      } else if (from && to) {
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
      return await paginationQuery({ page, count }, queryString, values);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Retrieves a preview of all tests for a given billing ID.
   * @param {number} billingid - The billing ID.
   * @returns {Promise<any[]>} - A promise that resolves to the list of test previews.
   */
  getAllTestPreview = async function (billingid: number): Promise<any[]> {
    try {
      if (billingid) {
        const alltest = await promisifyQuery(q_get_all_test_preview, [billingid]);
        return alltest;
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Retrieves the ultrasound waiting list with pagination.
   * @param {object} data - The pagination parameters.
   * @param {number} data.count - The number of results per page.
   * @param {number} data.page - The page number.
   * @returns {Promise<any[]>} - A promise that resolves to the list of ultrasound waiting items.
   */
  async getUltrasoundWaitingList(data: { count: number; page: number }): Promise<any[]> {
    const { count = 10, page = 1 } = data;
    const result = await paginationQuery({ count, page }, q_ultrasound_waitingList);
    return result;
  }

  /**
   * Retrieves the processed scan list based on various filters.
   * @param {ProcessedScan} data - The query parameters for filtering.
   * @returns {Promise<any[]>} - A promise that resolves to the list of processed scans.
   * @throws {Error} - Throws an error if the query fails.
   */
  public async processedScanList(data: ProcessedScan): Promise<any[]> {
    try {
      const { from, to, search, count = 10, page = 1,branchid} = data;
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

      const query = q_ultrasound_processed_list;
      values.unshift(whereClause);

      return await paginationQuery({ count, page }, query, values);
    } catch (err) {
      throw new Error(err);
    }
  }
}
