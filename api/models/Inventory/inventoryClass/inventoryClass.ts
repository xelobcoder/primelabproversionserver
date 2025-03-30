import { customError, paginationQuery, promisifyQuery, rowAffected } from "../../../../helper";
import logger from '../../../../logger';
import {
  DELETEASTOCKQUERY,
  DELETESTOCKABRANDQUERY,
  EXPIREDSTOCKSQUERY,
  FILTERSTOCKQUERY,
  GENERALUNEXPIREDSTOCKS,
  GETGENERALSTOCK,
  NEWSTOCKQUERY,
  q_debiting_stock,
  q_purchasetoConsumeInsight,
  UPDATEASTOCKQUERY,
  updateStockOrderQuery
} from "./queries";
// const database_queries = require("../../database/queries");
class Inventory implements InventoryInterface {
  stockid: number | null;

  constructor(stockid: number | null) {
    this.stockid = stockid || null;
  }

  async checkStockExist(stockname: string): Promise<boolean> {
    const item = await promisifyQuery(`SELECT * FROM generalstocks WHERE name = ?`, [stockname]);
    return item.length > 0;
  }

  async addNewStock(records: any): Promise<string | number> {
    const { name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf } = records;
    if (await this.checkStockExist(name)) return "EXIST";

    if (!category || typeof category !== "number" || !name) throw new Error("category of type number required and name required");
    const values = [name, category, consumptionunit, purchaseunit, quantity, alertlevel, materialcode, warehouse, shelf];

    const pushStock = await promisifyQuery(NEWSTOCKQUERY, values);
    return rowAffected(pushStock);
  }

  async updateAstock(records: any): Promise<number> {
    const { stockid, name, category, consumptionunit, purchaseunit, alertlevel, materialcode, warehouse, shelf, date } = records;
    if (!stockid) throw new Error("stockid required");
    if (!category || typeof category !== "number" || !(category > 0)) throw new Error("category must be a number greater than 0");
    const values = [consumptionunit, purchaseunit, alertlevel, materialcode, date, name, category, warehouse, shelf, stockid];
    const update = await promisifyQuery(UPDATEASTOCKQUERY, values);
    return rowAffected(update);
  }

  async deleteAstock(stockid: number): Promise<number> {
    if (!stockid || typeof stockid !== "number") throw new Error("stockid required");
    return await promisifyQuery(DELETEASTOCKQUERY, [stockid]);
  }

  async getStocks(query: any, warehouseid?: number | string): Promise<any[]> {
    let data: any[] = [];
    let newQuery = GETGENERALSTOCK;
    if (warehouseid && warehouseid !== "all") {
      newQuery += ` WHERE ns.warehouse = ? LIMIT ? OFFSET ?`;
      data = await paginationQuery(query, newQuery, [warehouseid]);
      return data;
    }
    newQuery += ` LIMIT ? OFFSET ?`;
    return await paginationQuery(query, newQuery);
  }

  async getAstock(stockid: number): Promise<any | undefined> {
    if (!stockid) return;
    return await promisifyQuery(`SELECT * FROM generalstocks WHERE stockid = ?`, [stockid]);
  }

  async getMainSupplyStock(stockid: number, brandid: number): Promise<any | Error> {
    if (!brandid || !stockid) return new Error("stockid and brandid required");
    return await promisifyQuery(`SELECT * FROM mainstoresupply WHERE stockid = ? AND brandid = ?`, [stockid, brandid]);
  }

  async getExpiredStock(query: any): Promise<any[]> {
    return await paginationQuery(query, EXPIREDSTOCKSQUERY);
  }

  async addStockCategory(records: any): Promise<number | Error> {
    const { category } = records;
    if (!category || typeof category !== "string") throw new Error("Must be of type string and category required");
    const stockAvailable = await promisifyQuery("SELECT * FROM stockcategory WHERE category = ?", [category]);
    if (stockAvailable.length > 0) return 1;
    const insertion = await promisifyQuery("INSERT INTO stockcategory (category) VALUE (?)", [category]);
    return rowAffected(insertion);
  }

  async getStockCategory(): Promise<any[]> {
    return await promisifyQuery(`SELECT * FROM stockcategory`);
  }

  async updateStockCategory(records: any): Promise<number | Error> {
    const { id, category } = records;
    if (!id || !category) throw new Error("category and id required");
    const stockAvailable = await promisifyQuery("SELECT * FROM stockcategory WHERE category = ?", [category]);
    if (stockAvailable.length === 0) return 1;
    const updateCat = await promisifyQuery("UPDATE stockcategory SET category = ? WHERE id = ?", [category, parseInt(id)]);
    return rowAffected(updateCat);
  }

  async deleteStockCategory(stockid: number): Promise<boolean> {
    if (!stockid) throw new Error("stockid required");

    const query = `DELETE FROM stockcategory WHERE id = ?`;
    const deletionResult = await promisifyQuery(query, [stockid]);

    return rowAffected(deletionResult);
  }

  async getGeneralUnExpiredStocks(requestQuery: any): Promise<any[]> {
    return await paginationQuery(requestQuery, GENERALUNEXPIREDSTOCKS);
  }

  async getGeneralExpired(query: any): Promise<any[]> {
    return await paginationQuery(query, EXPIREDSTOCKSQUERY);
  }

  async deleteStockBrand(records: any): Promise<number | string> {
    const { stockid, brandid } = records;
    if (!stockid || !brandid) return "stockid and brandid are required";

    const deleteResult = await promisifyQuery(DELETESTOCKABRANDQUERY, [stockid, brandid]);

    return rowAffected(deleteResult);
  }

  async getAstockBrands(records: any): Promise<any[]> {
    const { count, page, stockid } = records;
    if (!stockid) throw new Error("stockid not provided");
    const result = await paginationQuery({ count, page }, `SELECT * FROM stocksbrands WHERE stockid = ? LIMIT ? OFFSET ?`, [stockid]);
    return result;
  }

  async addStockBrand(records: any): Promise<number> {
    const { brand, stockid } = records;
    if (!brand || !stockid) throw new Error("brand name and stockid required");
    return rowAffected(await promisifyQuery(`INSERT INTO stocksbrands (brand,stockid) VALUES (?,?)`, [brand, stockid]));
  }

  async updateAStockBrand(records: any): Promise<number> {
    const { brand, stockid, brandid } = records;
    if (!brand || !stockid || !brandid) {
      throw new Error("brand,brandid and stockid are all required");
    }
    const UPDATESTOCKBRANDQUERY = `UPDATE stocksbrands SET brand = ? WHERE stockid = ? AND brandid = ?`;
    const isUpdated = await promisifyQuery(UPDATESTOCKBRANDQUERY, [brand, stockid, brandid]);
    return rowAffected(isUpdated);
  }

  async filterstock(filteringValue: string | null, query: any): Promise<any[]> {
    let SQLQUERY = FILTERSTOCKQUERY;
    if (!filteringValue) return [];
    let values = [filteringValue, filteringValue];
    const { warehouseid } = query;
    if (warehouseid && warehouseid !== "all") {
      SQLQUERY += ` AND gs.warehouse = ?`;
      values.push(warehouseid);
    }
    SQLQUERY += ` ORDER BY gs.name LIMIT ? OFFSET ?`;
    let data = await paginationQuery(query, SQLQUERY, values);
    if (data.length === 0) return data;
    data = data.map((item: any, index: number) => {
      return { ...item, quantityrequired: 0 };
    });
    return data;
  }

  public async updateStockOrders(data: any[]): Promise<any> {
    return promisifyQuery(updateStockOrderQuery, data);
  }

  public async updateOrderReceivedTransactionSummary(summary: any): Promise<boolean | Error> {
    const { orderTransactionid, method, amount, total } = summary;
    if (parseFloat(amount) < 0 || parseFloat(total) < 0 || !orderTransactionid) return false;
    const query = `UPDATE orderreceivedaccountsummary SET method  = ?,debit = ?, taxAmount = ?,updatedOn=NOW()  WHERE orderTransactionid = ?`;
    const values = [method, total, amount, orderTransactionid];
    return await promisifyQuery(query, values);
  }

  async receivePurchaseStocks(
    records: any[],
    total: number,
    tax: { amount: number; method: string },
    employeeid: number,
    response?: any
  ): Promise<boolean | void> {
    try {
      if (records.length === 0) {
        if (response) {
          customError("data must contain an array of products", 500, response);
          return;
        } else {
          throw new Error("data must be greater than 0");
        }
      }
      if (!tax || !Object.keys(tax).includes("amount") || !Object.keys(tax).includes("method")) {
        if (response) {
          return customError("Tax is an object with properties amount and method", 500, response);
        } else {
          throw new Error("Tax is an object with properties amount and method");
        }
      }
      const { orderTransactionid } = records[0];
      const requiredDataSource = records.map((item: any, index: number) => {
        const {
          productordersid,
          received,
          quantityReceived,
          receiveddate,
          status,
          expirydate,
          batchnumber,
          balance,
          brandid,
          price,
          totalamount,
          stockid,
        } = item;

        return [
          received,
          quantityReceived,
          receiveddate,
          status,
          expirydate,
          batchnumber,
          balance,
          parseInt(brandid),
          parseFloat(price),
          parseFloat(totalamount),
          productordersid,
          orderTransactionid,
          stockid,
          employeeid,
        ];
      });
      let successCount = 0;
      let errorCount = 0;
      let current = 0;
      let ordersSummaryUpdated = false;

      while (current < records.length) {
        const data = { ...requiredDataSource[current], employeeid };
        const updateRecord = await this.updateStockOrders(data);
        rowAffected(updateRecord) ? successCount++ : errorCount++;
        current++;
      }
      if (successCount === records.length) {
        const summary = {
          orderTransactionid,
          total: parseFloat(total.toString()),
          method: tax?.method,
          amount: parseFloat(tax?.amount.toString()),
        };
        const updateSummary = await this.updateOrderReceivedTransactionSummary(summary);
        ordersSummaryUpdated = rowAffected(updateSummary);
      }
      return !response
        ? ordersSummaryUpdated
        : response.send({ message: "order updated successfully", statusCode: 200, status: "success" });
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  }

  async getDebitHxSingle(productordersid: number): Promise<any[]> {
    const DEBITHX = `SELECT * FROM  generalstoredebithx WHERE productordersid = ?`;
    const queryValues = [productordersid];
    return await promisifyQuery(DEBITHX, queryValues);
  }

  async addDebitHx(
    productordersid: number,
    stockid: number,
    batchnumber: string,
    brandid: number,
    debitqty: number,
    wastage: number = 0
  ): Promise<number> {
    if (!productordersid || !stockid || !batchnumber || !brandid) {
      throw new Error("brandid ,stockid ,batchnumber and productordersid are required");
    }
    const query = `INSERT INTO generalstoredebithx (productordersid,stockid,brandid,batchnumber,wastage,debitqty)
    VALUES(?,?,?,?,?,?)`;

    return rowAffected(await promisifyQuery(query, [productordersid, stockid, brandid, batchnumber, wastage, debitqty]));
  }

  async getCreditHxSingle(productordersid: number, stockid: number, brandid: number, batchnumber: string): Promise<any[]> {
    const CREDITHX = `SELECT * FROM  generalstorecredithx WHERE productordersid = ? AND 
    stockid = ? AND brandid = ? AND batchnumber = ?`;
    const queryValues = [productordersid, stockid, brandid, batchnumber];
    return await promisifyQuery(CREDITHX, queryValues);
  }

  async isDebitable(stockid: number, brands: number[]): Promise<any[]> {
    if (!Array.isArray(brands) || brands.length === 0) {
      throw new TypeError("Array required and must not be empty");
    }
    const list = brands.join(",");
    const QUERY = q_debiting_stock.replace("{list}", list);
    let data = await promisifyQuery(QUERY, [stockid]);

    data = data
      .map((item: any, index: number) => {
        const storeQty = parseInt(item.credit) - parseInt(item.debitqty);
        return { ...item, storeQty };
      })
      .filter((a: any, b: any) => a["storeQty"] > 0);
    return data;
  }

  async purchasetoConsumeInsight(data: any): Promise<any[]> {
    const { stockid, records } = data;
    if (!stockid || !records) throw new Error("stockid and records are required");
    const getStockOrdersHx = await promisifyQuery(q_purchasetoConsumeInsight, [stockid, records]);
    let result: any[] = [];
    if (getStockOrdersHx.length > 0) {
      result = await Promise.all(
        getStockOrdersHx.map(async (transaction: any, i: number) => {
          const { batchnumber, brand, stockid, productordersid } = transaction;
          const getCreditHx = await this.getCreditHxSingle(productordersid, stockid, brand, batchnumber);
          const getDebitHx = await this.getDebitHxSingle(productordersid);
          transaction.credithistory = getCreditHx;
          transaction.debithistory = getDebitHx;
          return transaction;
        })
      );
    }
    return result;
  }

  async updateGeneralStocksQty(qty: number, stockid: number, operation: "add" | "minus" = "minus"): Promise<number | Error> {
    if (!qty || !stockid) return new Error("qty and stockid are all required");
    if (qty < 0) return new Error("qty must be greater than 0");
    const stockinfo = await this.getAstock(stockid);
    if (stockinfo.length === 0) return 0; // Adjust return type based on your error handling strategy
    const quantity = parseInt(stockinfo[0]["quantity"]);
    const newQty = operation === "add" ? quantity + qty : quantity - qty;
    const update = await promisifyQuery(`UPDATE generalstocks SET quantity = ? WHERE stockid = ?`, [newQty, stockid]);
    return rowAffected(update);
  }

  async updateMainSupplyGeneral(stockid: number, brandid: number, qty: number, operation: "add" | "minus"): Promise<number | null> {
    if (!stockid || !brandid || !qty) {
      throw new Error("stockid ,qty and brandid are required");
    }
    const info = await this.getMainSupplyStock(stockid, brandid);
    if (info.length === 0) return null;
    const infoqty = parseInt(info[0]["quantity"]);
    const newQty = operation === "add" ? infoqty + qty : infoqty - qty;
    const update = await promisifyQuery(
      `UPDATE mainstoresupply SET quantity = ? WHERE stockid = ?
    AND brandid = ?`,
      [newQty, stockid, brandid]
    );
    return rowAffected(update);
  }
}

export = Inventory;
