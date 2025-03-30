/**
 * Interface representing a Manager with basic properties and methods.
 */
interface IManager {
  /**
   * Method to retrieve manager approvals for a specified duration.
   * @param duration The duration for which approvals are requested.
   */
  getManagerApprovals(duration: string): void;

  /**
   * Method to verify if the current employee is a manager.
   * @returns Promise<boolean> indicating if the employee is a manager.
   */
  verificationManager(): Promise<boolean>;

  /**
   * Method to insert approval status into the database.
   * @param approvalStatus The approval status to be inserted.
   * @param message Optional message in case of decline.
   * @returns Promise<any> representing the result of the insertion.
   */
  insertApproval(approvalStatus: boolean, message?: string | null): Promise<any>;

  /**
   * Method to retrieve tests ready for approvals.
   * @param request The HTTP request object.
   * @param response The HTTP response object.
   * @returns Promise<void> indicating completion of the operation.
   */
  getReadyForApprovals(request: any, response: any): Promise<void>;
}
