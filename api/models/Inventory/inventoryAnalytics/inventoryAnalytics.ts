import { promisifyQuery, paginationQuery } from "../../../../helper"; 
import { logger } from "../../../../logger";
import * as queries from "./queries";

class Inventoryanalytics {
  stockid: number;
  departmentid: number;

  constructor(stockid: number, departmentid: number) {
    this.stockid = stockid;
    this.departmentid = departmentid;
  }

  async getCustomizationData() {
    return await promisifyQuery(queries.q_getCustomizationData);
  }

  parseJsonData(data: any) {
    if (data === "{}" || data === null || data === undefined) return false;
    return JSON.parse(data);
  }

  async customization() {
    const unparsed = await this.getCustomizationData();
    if (unparsed.length === 0) return;
    const { settings } = unparsed[0];
    return this.parseJsonData(settings);
  }

  async getNearExpiry(count = true) {
    const data = await this.customization();
    const nearExpiry = parseInt(data?.expirydays) + 1 || 22;
    const query = queries.q_getNearExpiry(count);
    const rowsCount = await promisifyQuery(query, nearExpiry);
    if (count) {
      return rowsCount.length > 0 ? rowsCount[0]["count"] : 0;
    }
    return rowsCount;
  }

  async getBelowAlert(count = true) {
    const query = queries.q_getBelowAlert(count);
    const data = await promisifyQuery(query);
    if (count) {
      return data.length > 0 ? data[0]["count"] : 0;
    }
    return data;
  }

  async getExpiredCount(count = true) {
    const query = queries.q_getExpiredCount(count);
    const data = await promisifyQuery(query);
    if (count) return data.length > 0 ? data[0]["count"] : 0;
    return data;
  }

  async getInvSummaryAnalytics() {
    const data = await promisifyQuery(queries.q_getInvSummaryAnalytics);
    return data.length > 0 ? this.parseJsonData(data[0]["settings"]) : {};
  }

  async getIncompOrdersCount(count: boolean) {
    try {
      const query = queries.q_getIncompOrdersCount(count);
      const result = await promisifyQuery(query);
      if (count === true) {
        return result.length > 0 ? result[0]["count"] : null;
      }
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async completeOrdersCount(count: boolean, t = { page: 1, count: 10 }) {
    try {
      let query = queries.q_completeOrdersCount(count);
      if (count === true) {
        const result = await promisifyQuery(query);
        return result.length > 0 ? result[0]["count"] : 0;
      }
      query += ` LIMIT ? OFFSET ?`;
      const result = await paginationQuery(t, query);
      return result;
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  }

  async updateInvenAnalSummary() {
    const { update: updateQ, insert: insertQ } = queries.q_updateInvenAnalSummary;
    try {
      const n = await this.getNearExpiry();
      const e = await this.getExpiredCount();
      const b = await this.getBelowAlert();
      const getSettings = await promisifyQuery(queries.q_getInvSummaryAnalytics);
      const data = JSON.stringify({ nearExpiryCount: n, belowAlertLevel: b, expiredCount: e });
      const isAvail = getSettings.length > 0;
      if (isAvail) {
        await promisifyQuery(updateQ, [data]);
      } else {
        await promisifyQuery(insertQ, [data]);
      }
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  }

  async quartersReducer(result: any) {
    if (!result || !Array.isArray(result)) return null;
    const reducer = (data: any) => data.reduce((sum: number, current: any) => sum + current?.debitAmount, 0);
    const totalWastage = reducer(result);
    const firstQ = reducer(result.filter((a: any, b: any) => a.quarter === 1));
    const secondQ = reducer(result.filter((a: any, b: any) => a.quarter === 2));
    const thirdQ = reducer(result.filter((a: any, b: any) => a.quarter === 3));
    return {
      firstQ,
      secondQ,
      thirdQ,
      totalWastage,
    };
  }

  async getWastagePerQuarters() {
    let query = queries.q_getWastagePerQuarters;
    let result = await promisifyQuery(query);
    if (result.length === 0) return result;
    return this.quartersReducer(result);
  }

  async getDepartmentWastageByQuartersSummary(departmentid: any) {
    if (!departmentid) throw new Error("departmentid required");
    const departmentWastageQuarters = queries.q_getDepartmentWastageByQuartersSummary;
    const data = await promisifyQuery(departmentWastageQuarters, [departmentid]);
    return await this.quartersReducer(data);
  }
}

export default Inventoryanalytics;
