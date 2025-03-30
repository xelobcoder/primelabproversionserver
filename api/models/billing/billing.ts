import { AscensionParameter, billErrors, IBillNewClient, Pagination, TBillingData } from "./billingclientTypes";
import { promisifyQuery, rowAffected } from "./../../../helper.js";
import {
  AddtoTestAscenstionQuery,
  currentDateBilledClients,
  deleteAscensionidQuery,
  deleteBillTransactionQuery,
  deleteNewBillPaymentHx,
  insertBillQuery,
  patientBilledTodayQuery,
  updatebillHistoryQuery,
} from "./queries";

/**
 * Represents a billing manager for handling billing operations.
 */
export class Billing implements IBillNewClient {
  readonly patientid: number;

  /**
   * Creates an instance of the Billing class.
   * @param patientid The ID of the patient.
   */
  constructor(patientid: number) {
    this.patientid = patientid;
  }

  /**
   * Retrieves transaction billing data for a specific billing ID.
   * @param billingid The ID of the billing transaction.
   * @returns A promise that resolves to an array of transaction data.
   */
  public async getTransactionBillData(billingid: number): Promise<[]> {
    return await promisifyQuery(`SELECT * FROM billing WHERE billingid  =? `, [billingid]);
  }

  /**
   * Retrieves the clients billed today for a specific branch.
   * @param branchid The ID of the branch.
   * @param pagination The pagination options including count and page.
   * @returns A promise that resolves to an array of billed clients.
   */
  public async getBranchDayBilledClients(branchid: number, { count = 10, page = 1 }: Pagination): Promise<[]> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const result: [] = await promisifyQuery(currentDateBilledClients, [currentYear, month, day, branchid]);
    return result;
  }

  /**
   * Wrapper method to execute a callback with try/catch error handling.
   * @param cb The callback to execute.
   * @param errcb The error callback to execute in case of an error.
   * @returns The result of the callback or null in case of an error.
   */
  public wrapperTryCatch<T>(cb: () => T, errcb: (_err: any) => void): T | null {
    try {
      return cb();
    } catch (err) {
      if (errcb && typeof errcb == "function") {
        errcb(err);
      } else {
        console.error("Error uncaught and unhandled", err);
      }
    }
  }

  /**
   * Inserts a new billing record.
   */
  public async insertNewBilling() {}

  /**
   * Bills a client based on the provided billing data.
   * @param data The billing data.
   * @returns A promise that resolves to the insert ID or false in case of an error.
   */
  async billClient(data: TBillingData): Promise<number | boolean> {
    try {
      const {
        patientid,
        clinician = 0,
        organization = 0,
        paid,
        payable,
        outstanding,
        discount,
        samplingCenter,
        taxIncluded,
        taxValue,
        status,
        testcost,
        employeeid,
        type,
      } = data;

      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const partitionName = `billing_${year}_${month}`;

      const values: (string | number | boolean)[] = [
        patientid,
        clinician,
        organization,
        paid,
        payable,
        type,
        outstanding,
        discount,
        samplingCenter,
        taxIncluded,
        taxValue,
        status,
        testcost,
        employeeid,
      ];

      const { affectedRows, insertId } = await promisifyQuery(insertBillQuery, values);
      if (affectedRows == 0) return false;
      return insertId;
    } catch (err) {
      throw new Error(billErrors.error);
    }
  }

  /**
   * Checks if the complete flow of the laboratory flow is activated like from registration to phelobotomy to sample validation, processing and result entry.
   * @returns A promise that resolves to a boolean indicating if the complete flow is enabled.
   */
  public async isCompleteFlow(): Promise<boolean> {
    const settings = await promisifyQuery(`SELECT * FROM applicationsettings`);
    if (settings.length == 0) return false;
    return settings[0]["completeFlow"] == 1 ? true : false;
  }

  /**
   * Updates the billing history for a specific billing ID.
   * @param paymentmode The payment mode.
   * @param billingid The billing ID.
   * @param amount The amount to update.
   * @returns A promise that resolves to the result of the update query.
   */
  public async updateBillingHistory(paymentmode: number, billingid: number, amount: number): Promise<any> {
    const values: number[] = [paymentmode, amount, billingid];
    return await promisifyQuery(updatebillHistoryQuery, values);
  }

  /**
   * Updates the approval status for a specific billing and test ID.
   * @param billingid The billing ID.
   * @param testid The test ID.
   * @returns A promise that resolves to the result of the update query.
   */
  public async updateApprovalStatus(billingid: number, testid: number): Promise<any> {
    try {
      const query = `UPDATE samplestatus SET approvalstatus = 1 WHERE billingid = ? AND testid = ?`;
      const values = [billingid, testid];
      return promisifyQuery(query, values);
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Deletes an ascension ID for a specific billing and test ID.
   * @param billingid The billing ID.
   * @param testid The test ID.
   * @returns A promise that resolves to a boolean indicating if the row was affected.
   */
  public async deleteAscensionid(billingid: number, testid: number): Promise<boolean> {
    const result = await promisifyQuery(deleteAscensionidQuery, [billingid, testid]);
    return rowAffected(result);
  }

  /**
   * Checks if a patient has been billed today.
   * @param patientid The patient ID.
   * @returns A promise that resolves to a boolean indicating if the patient has been billed today.
   */
  public async haveBeenBilledToday(patientid: number): Promise<boolean> {
    const result = await promisifyQuery(patientBilledTodayQuery, patientid);
    return !(result[0]["count"] > 0);
  }

  /**
   * Deletes entries with errors based on the inserted test IDs.
   * @param inserted The array of inserted test IDs.
   * @param billingid The billing ID.
   */
  private async deleteAddedWithError(inserted: number[], billingid: number): Promise<void> {
    let counter: number = 0;
    while (inserted.length > 0 && counter <= inserted.length) {
      const isDeleted = rowAffected(await this.deleteAscensionid(billingid, inserted[counter]));
      if (isDeleted) {
        inserted = inserted.filter((a) => a != inserted[counter]);
      }
      counter++;
    }
  }

  /**
   * Adds tests to ascension for a specific billing ID.
   * @param data The ascension parameters.
   * @returns A promise that resolves to a boolean indicating if all tests were added successfully.
   */
  public async AddtoTestAscenstion(data: AscensionParameter): Promise<boolean> {
    const { billingid, testidCollection } = data;
    let insertionCount = 0;
    const inserted: number[] = [];
    try {
      if (testidCollection.length == 0) throw new Error("Bad Parameters, testCollection not added");
      const fullFlow = await this.isCompleteFlow();
      for (let i = 0; i < testidCollection.length; i++) {
        const testid = testidCollection[i];
        const isInserted: boolean = await promisifyQuery(AddtoTestAscenstionQuery, [testid, billingid, fullFlow ? "false" : "true"]);
        if (!isInserted) throw new Error(billErrors.failed);
        insertionCount++;
        inserted.push(testid);
        if (!fullFlow) {
          await this.updateApprovalStatus(billingid, testid);
        }
      }
      return insertionCount === testidCollection.length;
    } catch (err) {
      await this.deleteAddedWithError(inserted, billingid);
      throw new Error(err?.message || err);
    }
  }

  /**
   * Deletes a billing transaction for a specific billing ID.
   * @param billingid The billing ID.
   * @returns A promise that resolves to the result of the delete query.
   */
  public async deleteBillTransaction(billingid: number): Promise<any> {
    return await promisifyQuery(deleteBillTransactionQuery, [billingid]);
  }

  /**
   * Cleans up recorded payment history for a specific billing ID.
   * @param billingid The billing ID.
   */
  async cleanUpRecordedPaymentHx(billingid: number): Promise<void> {
    await promisifyQuery(deleteNewBillPaymentHx, billingid);
  }

  /**
   * Handles the insertion process for billing data.
   * @param billingData The billing data.
   * @param strict Indicates if strict checking should be done.
   * @returns A promise that resolves to a boolean or string indicating the result of the insertion process.
   */
  public async insertionProcess(billingData: TBillingData, strict: boolean = true): Promise<boolean | string> {
    let isHistoryAdded = false;
    let isAscAdded = false;
    let billingid = undefined;
    try {
      let canInitiateNewBill = true;
      if (strict) {
        canInitiateNewBill = await this.haveBeenBilledToday(this.patientid);
      }

      if (!canInitiateNewBill) {
        return billErrors.already;
      }
      billingid = await this.billClient(billingData);

      if (typeof billingid == "boolean" || !billingid) return billErrors.failed;

      isAscAdded = await this.AddtoTestAscenstion({ billingid, testidCollection: billingData.test });
      isHistoryAdded = rowAffected(await this.updateBillingHistory(billingData.paymentmode, billingid, billingData.paid));
      if (isAscAdded && isHistoryAdded && billingid) {
        return true;
      }
      await this.deleteBillTransaction(billingid);
      return billErrors.failed;
    } catch (err) {
      if (billingid) {
        await this.deleteBillTransaction(billingid);
      }
      return billErrors.error;
    }
  }
}
