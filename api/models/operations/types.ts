export const enum OperationsFailures {
  notready = "billingid  not ready for result entry",
  unfoundID = "such id not found",
  organizationalPricingDiscountedIssue = 'There is an issue with the organizational pricing discounted values provided',
  OrganizationExist = "Organization With Such Name Already Exist",
  invalidTestLength = "invalid test length provided"
}



export type resultQuery = {
  from: string;
  to: string;
  patientid: number;
  fullname?: string;
  billingid: number;
  sortingwise: number;
  count: number;
  page: number;
};




export type ProcessedScan = {
  search: string,
  from: string,
  count: number,
  page: number,
  to: string,
  branchid?: number
}



export interface OperationsFilterResultEntry {
  fullname?: string;
  count?: number;
  page?: number;
  departmentid?: number | string;
  testid?: number;
  status?: string;
  billingid?: number;
  branchid:number;
  from?: string;
  to?: string;
}
