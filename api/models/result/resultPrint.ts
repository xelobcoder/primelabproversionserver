import logger from "../../../logger";
import { promisifyQuery, customError, rowAffected, paginationQuery } from "../../../helper";
import Creator from "../creator/creator";
import Registration from "../registration/registration";
import {testpanel} from "../../testpanel/list";
import {
  extrainfoTestQuery,
  updatePrintCountQuery,
  modelQueryWithFilters,
  approvedByUsernameQuery,
  approvedByQuery,
  usernameQuery,
  summaryReadyPageQuery,
  samplingQuery,
  makeDecisionOnResultQuery,
  checkApprovalQuery,
  advancedTablesSearchQueryWithFilters,
  transactionApprovedTestQuery,
} from "./queries";
import IResultPrint from "./RInterface";

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
class ResultPrint  implements IResultPrint{
  billingid: number;

  constructor(billingid: number) {
    this.billingid = billingid;
  }

  /**
   * Retrieves printable test results based on query parameters.
   * @param {Object} requestquery - The query parameters from the request.
   * @returns {Promise<Array>} - The list of printable test results.
   */
  async get_printables(requestquery: { querydate?: string; content?: string }): Promise<any[]> {
    const { querydate, content } = requestquery;
    let { query, params } = modelQueryWithFilters(querydate, content);
    const printables = await promisifyQuery(query, params);
    return printables;
  }

  /**
   * Retrieves extra information about a test.
   * @param {number} id - The billingid.
   * @returns {Promise<any[]>} - The extra information about the test.
   */
  async get_extrainfo_test(id: number): Promise<any[]> {
    const result = await promisifyQuery(extrainfoTestQuery, [id]);
    return result;
  }

  /**
   * Updates the print count for a test.
   * @param {number} id - The ID of the test.
   * @param {number} count - The new print count.
   * @throws Will throw an error if id or count is not provided.
   */
  async updatePrintCount(id: number, count: number): Promise<any> {
    if (!id || !count) {
      throw new Error("test ascension id and count required");
    }
    const result = await promisifyQuery(updatePrintCountQuery, [count, id]);
    return result;
  }

  /**
   * Retrieves the result entry scientist's username and the username of the person who validated the result.
   * @param {number} billingid - The billing ID.
   * @param {number} testid - The test ID.
   * @returns {Promise<{ resultentry: string | null; validatedBy: string | null }>} - The usernames of the result entry scientist and the validator.
   * @throws Will throw an error if billingid or testid is not provided.
   */
  async getResultEntryScientist(billingid: number, testid: number): Promise<{ resultentry: string | null; validatedBy: string | null }> {
    try {
      if (!billingid || !testid) {
        throw new Error("billingid and testid are required");
      }
      let testname: string | null = null;
      const testnameResult = await promisifyQuery(`SELECT * FROM test_panels WHERE id = ?`, [testid]);
      if (testnameResult.length > 0) {
        testname = testnameResult[0]["name"];
      }
      if (!testname) {
        throw new Error("wrong testid provided");
      }

      const tablename = testpanel.generatedTestTableName(testname);
      const getEmployeeid = await promisifyQuery(`SELECT employeeid FROM \`${tablename}\` WHERE billingid = ?`, [billingid]);
      let employeeid: string | null = null;
      if (getEmployeeid.length > 0) {
        employeeid = getEmployeeid[0]["employeeid"];
      }

      let username: string | null = null;
      const usernameResult = await promisifyQuery(approvedByUsernameQuery, [employeeid]);
      if (usernameResult.length > 0) {
        username = usernameResult[0]["username"];
      }

      let approvedBy: string | null = null;
      const approvedByResult = await promisifyQuery(approvedByQuery, [billingid, testid]);
      if (approvedByResult.length > 0) {
        approvedBy = approvedByResult[0]["ApprovedBy"];
        const approvedByUsernameResult = await promisifyQuery(usernameQuery, [approvedBy]);
        if (approvedByUsernameResult.length > 0) {
          approvedBy = approvedByUsernameResult[0]["username"];
        }
      }
      return { resultentry: username, validatedBy: approvedBy };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Retrieves summary information for the ready page based on query parameters.
   * @param {Object} requestquery - The query parameters
   * @returns {Promise<void>}
   */
  async get_summary_ready_page(requestquery: { querydate?: string; content?: string }): Promise<any[]> {
    const { querydate } = requestquery;

    function getTodayDate(): string {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    try {
      const result = await promisifyQuery(summaryReadyPageQuery, [querydate || getTodayDate(), querydate || getTodayDate()]);
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
          { title: "registered clients", value: result[0]?.["registered"] },
          { title: "test count", value: testcount },
          { title: "samples collected", value: collection },
          { title: "processed test", value: processing },
          { title: "test ready", value: ready },
          { title: "Approved test", value: approval },
        ];
      } else {
        return emptySummry;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * Retrieves sampling information for a test.
   * @param {number} billing - The billing ID.
   * @param {number} testid - The test ID.
   * @returns {Promise<any>} - The sampling information.
   */
  async getSamplingInformation(billing: number, testid: number): Promise<any> {
    try {
      let sampling = await promisifyQuery(samplingQuery, [billing, testid]);
      if (sampling.length === 0) return {};
      sampling = sampling.map((item) => {
        const processing_time = new Date(item?.processing_date).toLocaleTimeString();
        const collection_time = new Date(item?.collection_date).toLocaleTimeString();
        const ready_time = new Date(item?.ready_date).toLocaleTimeString();
        const processing_date = new Date(item?.processing_date).toLocaleDateString();
        const collection_date = new Date(item?.collection_date).toLocaleDateString();
        const ready_date = new Date(item?.ready_date).toLocaleDateString();
        return { ...item, processing_date, collection_date, ready_date, processing_time, collection_time, ready_time };
      });
      return sampling[0];
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * Retrieves comments for a test.
   * @param {number} billingid - The billing ID.
   * @param {number} testid - The test ID.
   * @param {Object} response - The response object.
   * @returns {Promise<any[]>} - The list of comments.
   */
  async getComments(billingid: number, testid: number, response?: any): Promise<any[]> {
    try {
      const result = await promisifyQuery(`SELECT * FROM result_comments WHERE BILLINGID = ? AND TESTID = ?`, [billingid, testid]);
      if (response) {
        response.send({ status: "success", statusCode: 200, result });
      } else {
        return result;
      }
    } catch (err) {
      logger.error(err);
      if (response) {
        customError("error occured", 500, response);
      } else {
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
  async makeDecisionOnResult(requestbody: {
    billingid: number;
    testid: number;
    declineMessage?: string;
    approvalstatus: number;
    actionPlan?: string;
    approvedby: string;
  }): Promise<number> {
    const { billingid, testid, declineMessage, approvalstatus, actionPlan, approvedby } = requestbody;

    try {
      const queryResult = await promisifyQuery(makeDecisionOnResultQuery, [
        approvalstatus,
        actionPlan,
        declineMessage,
        approvedby,
        billingid,
        testid,
      ]);
      return rowAffected(queryResult);
    } catch (err) {
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
  async checkApproval(billingid: number, testid: number): Promise<boolean> {
    try {
      const result = await promisifyQuery(checkApprovalQuery, [billingid, testid]);
      if (result && result.length > 0) {
        const { approvalstatus } = result[0];
        return approvalstatus === 1;
      }
      return false;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Performs an advanced search on tables with filters.
   * @param {Object} requestquery - The query parameters from the request.
   * @returns {Promise<any>} - The search results.
   * @throws Will throw an error if the query fails.
   */
  async advancedTablesSearch(requestquery: any): Promise<any> {
    try {
      const { values, query } = advancedTablesSearchQueryWithFilters(requestquery);
      const { count, page } = requestquery;
      const result = await paginationQuery({ count, page }, query, values);
      return result;
    } catch (err) {
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
  async previewReport(request: any, response: any): Promise<any[]> {
    try {
      const { testid, billingid } = request.query;
      if (!testid || !billingid) return customError("required query params missing", 400, response);
      let patientid = await new Registration().getPatientInfoUsingBillingId(parseInt(billingid));
      if (patientid.length === 0) return customError("patient not found", 404, response);
      patientid = patientid[0]["patientid"];
      const result = await new Creator(testid).getCustomPreviousRecords(testid, billingid, patientid);
      return result;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Retrieves approved test transactions for a billing ID.
   * @param {number} billingid - The billing ID.
   * @returns {Promise<any[]>} - The list of approved test transactions.
   * @throws Will throw an error if billingid is not provided or the query fails.
   */
  async getTransactionApprovedTest(billingid: number): Promise<any[]> {
    try {
      if (!billingid) {
        throw new Error("billingid is required");
      }
      const result = await promisifyQuery(transactionApprovedTestQuery, [billingid]);
      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default ResultPrint;
