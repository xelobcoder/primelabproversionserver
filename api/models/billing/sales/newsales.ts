import { Billing } from "../billing.js";
import { ISales } from "../billingclientTypes.js";
import { q_dailySalesSummary } from "./queries.js";
import { promisifyQuery, rowAffected } from "../../../../helper.js";


export class Sales extends Billing implements ISales {
  patientid: number;
  branchid: number | string;
  constructor(branchid: string | number, patientid: number) {
    super(patientid);
    this.branchid = branchid;
  }
  getYearlySalesSummary(branchid: number | string) {
    throw new Error("Method not implemented.");
  }
  getMonthlySalesSummary(branchid: number | string) {
    throw new Error("Method not implemented.");
  }
  getMonthDailySalesSummary(branchid: number | string) {
    throw new Error("Method not implemented.");
  }
  getMonthWeeklySalesSummary(branchid: number) {
  }
  public async getDailySalesSummary(branchid: number | string): Promise<[]> {
    var query: string = q_dailySalesSummary;
    if (typeof branchid === "number") {
      query += ` AND branchid = ?`;
    }
    const summary = await promisifyQuery(q_dailySalesSummary, [branchid]);
    return summary;
  }
}
