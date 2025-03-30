import { paginationQuery, promisifyQuery, rowAffected } from "../../../../helper";
import Inventory from "../inventoryClass/inventoryClass";
import {
  SELECT_DEPT_MONTHLY_SUMMARY_QUERY,
  SELECT_DEPT_QUARTERLY_DATA_QUERY,
  SELECT_MONTHLY_SUMMARY_QUERY,
  SELECT_ORDER_WASTAGE_DATA_QUERY,
  SELECT_PRODUCT_INSTOCK_QUERY,
  SELECT_QUARTERLY_DATA_QUERY,
  SELECT_WASTAGE_DEBIT_HX_QUERY,
  UPDATE_DEPT_PRODUCT_DISPOSE_QUERY,
  UPDATE_ORDERS_WASTAGE_QUERY,
} from "./queries";

class WastageInventory extends Inventory {
  stockid: number;

  constructor(stockid: number) {
    super(stockid);
    this.stockid = stockid;
  }

  async calculateProductInstock(stockid: number, brand: number, batchnumber: string) {
    const data = await promisifyQuery(SELECT_PRODUCT_INSTOCK_QUERY, [stockid, batchnumber, brand]);
    const qtyReceived = data.length > 0 ? data[0]["qty"] : 0;
    return qtyReceived;
  }

  async getOrderWastageData(stockid: number, brandid: number, batchnumber: string) {
    return await promisifyQuery(SELECT_ORDER_WASTAGE_DATA_QUERY, [stockid, brandid, batchnumber]);
  }

  async calcalulateWastageTotal(stockid: number, brandid: number, batchnumber: string) {
    if (!stockid || !batchnumber || !brandid) throw new Error("batchnumber, stockid, and brandid are required");

    let data = await this.getOrderWastageData(stockid, brandid, batchnumber);
    if (data.length === 0) return 0;

    data = data.reduce((acc, cur) => acc + cur?.debitqty, 0);
    return data;
  }

  async updateOrdersWastage(productordersid: number, state: number) {
    return await promisifyQuery(UPDATE_ORDERS_WASTAGE_QUERY, [state, productordersid]);
  }

  async isWastageDebitHxExist(productordersid: number) {
    const result = await promisifyQuery(SELECT_WASTAGE_DEBIT_HX_QUERY, [productordersid]);
    return result.length > 0;
  }

  async disposeoffExpireProduct(records: { productordersid: number; brandid: number; stockid: number; batchnumber: string }) {
    const { productordersid, brandid, stockid, batchnumber } = records;

    if (!productordersid) {
      throw new Error("Required keys not found in object provided");
    }

    if (await this.isWastageDebitHxExist(productordersid)) return "EXIST";

    const total = await this.calculateProductInstock(stockid, brandid, batchnumber);

    try {
      await this.addDebitHx(productordersid, stockid, batchnumber, brandid, total, 1);
      await this.updateOrdersWastage(productordersid, 1);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  async disposeoffDeptProduct(records: {
    brandid: number;
    stockid: number;
    batchnumber: string;
    departmentid: number;
    employeeid: number;
    qtyAvailable: number;
  }) {
    const { brandid, stockid, batchnumber, departmentid, employeeid } = records;

    if (!departmentid || !stockid || !batchnumber || !brandid || !employeeid) {
      throw new Error("departmentid, batchnumber, employeeid, brandid, and stockid required");
    }

    const queryR = await promisifyQuery(UPDATE_DEPT_PRODUCT_DISPOSE_QUERY, [1, employeeid, departmentid, batchnumber, brandid, stockid]);

    const isdisposed = rowAffected(queryR);
    return isdisposed;
  }

  async getQuarterlyData(quarters: number, count: number = 10, page: number = 1) {
    if (!quarters || !(quarters < 4 && quarters > 0)) {
      throw new Error("Quarters are required and must be between 1 and 3");
    }

    let query = SELECT_QUARTERLY_DATA_QUERY;

    if (quarters === 1) query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`;
    if (quarters === 2) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`;
    if (quarters === 3) query += ` AND MONTH(dhx.debitdate)  BETWEEN 9 AND 12`;

    return await paginationQuery({ count, page }, query);
  }

  async getMonthlySummaryByQuarters(quarters: number) {
    let query = SELECT_MONTHLY_SUMMARY_QUERY;

    if (quarters === 1) query += ` AND MONTH(dhx.debitdate)  BETWEEN 1 AND 4`;
    if (quarters === 2) query += ` AND MONTH(dhx.debitdate)  BETWEEN 5 AND 8`;
    if (quarters === 3) query += ` AND MONTH(dhx.debitdate)  BETWEEN 9 AND 12`;

    return await promisifyQuery(query);
  }

  async getDeptMonthlySummaryWastages(quarters: number, departmentid: number) {
    if (!departmentid || !quarters || quarters <= 0 || quarters > 3) {
      throw new Error("Departmentid and quarters are required, and quarters must be between 1 and 3.");
    }

    let query = SELECT_DEPT_MONTHLY_SUMMARY_QUERY;

    if (quarters === 1) query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`;
    if (quarters === 2) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`;
    if (quarters === 3) query += ` AND MONTH(dchx.date)  BETWEEN 9 AND 12`;

    return await promisifyQuery(query, [departmentid]);
  }

  async getDeptQuarterlyWastageData(quarters: number, departmentid: number, count: number = 10, page: number = 1) {
    if (!quarters || !(quarters < 4 && quarters > 0) || !departmentid) {
      throw new Error("Quarters and departmentid are required, and quarters must be between 1 and 3.");
    }

    let query = SELECT_DEPT_QUARTERLY_DATA_QUERY;

    if (quarters === 1) query += ` AND MONTH(dchx.date)  BETWEEN 1 AND 4`;
    if (quarters === 2) query += ` AND MONTH(dchx.date)  BETWEEN 5 AND 8`;
    if (quarters === 3) query += ` AND MONTH(dchx.date)  BETWEEN 9 AND 12`;

    return await paginationQuery({ count, page }, query, [departmentid]);
  }
}

export default WastageInventory;
