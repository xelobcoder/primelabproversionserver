const enum clientStatus {
  urgent = "urgent",
  moderate = "moderate",
  routine = "routine",
  normal = "normal",
}


export type TBillingData = {
  patientid: number;
  clinician: number;
  organization: number;
  test: number[];
  payable: number;
  testcost: number;
  paid: number;
  type: string;
  taxIncluded: boolean;
  taxValue: number;
  status: clientStatus;
  discount: number;
  branchid: number,
  paymentmode: number;
  samplingCenter: number;
  outstanding: number;
  cost: number;
  employeeid: number;
};

export enum billErrors {
  already = "client billed on same day. Kindly check the billing history to update billing",
  failed = "billing client failed",
  error = "error occured in processing  transaction",
  badparams = "Bad Request provided",
}

export type Pagination = {
  count: number;
  page: number;
};
export interface IBillNewClient {
  readonly patientid: number;
  updateBillingHistory(paymentmode: number, billingid: number, amount: number): any;
  billClient(data: TBillingData): any;
  getBranchDayBilledClients(branchid: number, pagination: Pagination): Promise<[]>;
  getTransactionBillData(billingid: number): Promise<[]>;
}

export interface ISales {
  getDailySalesSummary(branchid: number | string);
  getYearlySalesSummary(branchid: number | string);
  getMonthlySalesSummary(branchid: number | string);
  getMonthDailySalesSummary(branchid: number | string);
}

export type AscensionParameter = {
  billingid: number;
  testidCollection: number[];
};

export type AddingTablePartion = {
  tableName: string;
  columns: string[];
  prefix: string;
  suffix: string;
};



export type BreakingPoint = {
  min: number;
  max: number;
};


export interface Partition {
  tablename: string,
  
}


/**
 * Represents the interface for managing billing operations.
 */
interface IPartitionManager {
  /**
   * Retrieves all billing partitions associated with a table.
   * @param tablename The name of the table to fetch partitions for.
   * @returns A list of partition names.
   */
  getTablePartitions(tablename: string): Promise<any[]>;

  /**
   * Adds a new partition to the managed table.
   * @param tablename The name of the table to add partitions to.
   * @param year The year for which to add partitions.
   * @returns A promise indicating the success of the operation.
   */
  addYearPartition(tablename: string, year: number): Promise<boolean>;

  /**
   * Drops all partitions from the managed table.
   * @param tablename The name of the table to drop partitions from.
   * @returns A promise indicating the success of the operation.
   */
  dropTablePartition(tablename: string): Promise<any>;

  /**
   * Drops a specific partition from the managed table.
   * @param tablename The name of the table to drop partitions from.
   * @param partitionName The name of the partition to drop.
   * @returns A promise indicating the success of the operation.
   */
  dropTableSpecificPartition(tablename: string, partitionName: string): Promise<any>;
}

export default IPartitionManager;
