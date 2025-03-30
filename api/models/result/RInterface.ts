/**
 * Interface representing ResultPrint with various methods to handle print-related functionalities.
 */
interface IResultPrint {
  billingid: number;

  /**
   * Retrieves printable test results based on query parameters.
   * @param {Object} requestquery - The query parameters from the request.
   * @returns {Promise<Array>} - The list of printable test results.
   */
  get_printables(requestquery: { querydate?: string; content?: string }): Promise<any[]>;

  /**
   * Retrieves extra information about a test.
   * @param {number} id - The billingid.
   * @returns {Promise<any[]>} - The extra information about the test.
   */
  get_extrainfo_test(id: number): Promise<any[]>;

  /**
   * Updates the print count for a test.
   * @param {number} id - The ID of the test.
   * @param {number} count - The new print count.
   * @throws Will throw an error if id or count is not provided.
   */
  updatePrintCount(id: number, count: number): Promise<any>;

  /**
   * Retrieves the result entry scientist's username and the username of the person who validated the result.
   * @param {number} billingid - The billing ID.
   * @param {number} testid - The test ID.
   * @returns {Promise<{ resultentry: string | null; validatedBy: string | null }>} - The usernames of the result entry scientist and the validator.
   * @throws Will throw an error if billingid or testid is not provided.
   */
  getResultEntryScientist(billingid: number, testid: number): Promise<{ resultentry: string | null; validatedBy: string | null }>;

  /**
   * Retrieves summary information for the ready page based on query parameters.
   * @param {Object} requestquery - The query parameters
   * @returns {Promise<void>}
   */
  get_summary_ready_page(requestquery: { querydate?: string; content?: string }): Promise<any[]>;

  /**
   * Retrieves sampling information for a test.
   * @param {number} billing - The billing ID.
   * @param {number} testid - The test ID.
   * @returns {Promise<any>} - The sampling information.
   */
  getSamplingInformation(billing: number, testid: number): Promise<any>;

  /**
   * Retrieves comments for a test.
   * @param {number} billingid - The billing ID.
   * @param {number} testid - The test ID.
   * @param {Object} response - The response object.
   * @returns {Promise<any[]>} - The list of comments.
   */
  getComments(billingid: number, testid: number, response?: any): Promise<any[]>;

  /**
   * Makes a decision on the result of a test (approve or decline).
   * @param {Object} requestbody - The request body containing the decision details.
   * @returns {Promise<number>} - The number of rows affected by the update.
   * @throws Will throw an error if the query fails.
   */
  makeDecisionOnResult(requestbody: {
    billingid: number;
    testid: number;
    declineMessage?: string;
    approvalstatus: number;
    actionPlan?: string;
    approvedby: string;
  }): Promise<number>;

  /**
   * Checks if a test has been approved.
   * @param {number} billingid - The billing ID.
   * @param {number} testid - The test ID.
   * @returns {Promise<boolean>} - True if the test is approved, false otherwise.
   * @throws Will throw an error if the query fails.
   */
  checkApproval(billingid: number, testid: number): Promise<boolean>;

  /**
   * Performs an advanced search on tables with filters.
   * @param {Object} requestquery - The query parameters from the request.
   * @returns {Promise<any>} - The search results.
   * @throws Will throw an error if the query fails.
   */
  advancedTablesSearch(requestquery: any): Promise<any>;

  /**
   * Previews a report based on query parameters.
   * @param {Object} request - The request object.
   * @param {Object} response - The response object.
   * @returns {Promise<any[]>} - The report data.
   * @throws Will throw an error if the query fails.
   */
  previewReport(request: any, response: any): Promise<any[]>;

  /**
   * Retrieves approved test transactions for a billing ID.
   * @param {number} billingid - The billing ID.
   * @returns {Promise<any[]>} - The list of approved test transactions.
   * @throws Will throw an error if billingid is not provided or the query fails.
   */
  getTransactionApprovedTest(billingid: number): Promise<any[]>;
}

export default IResultPrint;
