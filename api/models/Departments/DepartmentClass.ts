import { DepartMain, EscrowOrder, EsrowData, ServeDeptType, updateQtyDeptReceived, UpdateReqtData } from "./types";

import { promisifyQuery, rowAffected } from "../../../helper";
import logger from "../../../logger";
import Inventory from "./../Inventory/inventoryclass";
import Escrow from "../Inventory/escrow/esrow";

export default class Departments {
  private departmentid: number;
  constructor(departmentid: number) {
    this.departmentid = departmentid;
  }

  async getPendingdepartmentReqSummary() {
    let query = q_pending_department_summary;
    if (this.departmentid) {
      query += ` AND departmentid = ?`;
    }
    query += ` GROUP BY hx.departmentid`;
    return await promisifyQuery(query, [this.departmentid]);
  }

  async getDeptSpecificReqData(id: number, type: string) {
    try {
      // join department requisition table with  name of department  table and name of newstock table
      if (!id) return new Error("id required");

      let mysql_query = q_get_specific_dept_requisition_data;

      if (type === "pending") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NULL AND store_supplied = 0 `;
      }

      if (type === "approved") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'approved' AND store_supplied = 0`;
      }

      if (type === "rejected") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'rejected'`;
      }

      if (type === "received") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'received'`;
      }

      if (type === "receiving") {
        mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'approved' AND store_supplied = 1`;
      }

      return promisifyQuery(mysql_query, [id]);
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  }

  async StoreServeDeptReq(departmentid: number, stockid: number): Promise<[] | void> {
    if (!departmentid || !stockid) throw new Error("Departmentid and stockid Required");

    const inventory = new Inventory();

    const brands = await inventory.getAstockBrands({ stockid });

    const stocksbrands = brands.map((a: any, i: number) => a.brandid);

    if (stocksbrands.length === 0) return [];

    let product = await promisifyQuery(
      `SELECT * FROM mainstoresupply AS ms INNER JOIN stocksbrands AS sb ON sb.brandid =  ms.brandid
      WHERE ms.brandid IN (${
        stocksbrands.length === 1 ? stocksbrands[0] : Array.prototype.toString.call(stocksbrands)
      }) AND ms.stockid = ?`,
      [stockid]
    );

    product = product.map((item, index) => {
      return { ...item, storeQty: item?.quantity };
    });
    return product;
  }

  async checkStoreSuppliedAlready(requisitionid: number) {
    if (!requisitionid) throw new Error("requisition id is required");
    const row = await promisifyQuery(q_has_store_supplied_already, [requisitionid]);
    return row[0]["store_supplied"] == 1;
  }

  async addNewDeptRequisionhx(records) {
    const { productordersid, stockid, brandid, batchnumber, served, type, requisitionid, departmentid } = records;

    const values = [productordersid, stockid, brandid, batchnumber, served, requisitionid, departmentid, "received"];

    return rowAffected(await promisifyQuery(q_new_department_reqt, values));
  }

  async addProductEscrow(data: EsrowData) {
    const { productordersid, stockid, brandid, batchnumber, qty, type, requisitionid, departmentid } = data;
    const values: (string | number)[] = [productordersid, stockid, brandid, batchnumber, qty, type, requisitionid, departmentid];
    return await promisifyQuery(q_new_Escrow_data, values);
  }

  async checkEscrowOrderExists(data: EscrowOrder) {
    const { productordersid, stockid, batchnumber, brandid } = data;
    const result = await promisifyQuery(q_escrow_order_exist, [productordersid, stockid, brandid, batchnumber]);
    const orderCount = result[0].count;
    return orderCount > 0;
  }

  async serveApprovedReqt(reqtData: ServeDeptType) {
    const { data, approvedQty, requisitionid, departmentid } = reqtData;
    try {
      if (!Array.isArray(data) || approvedQty < 0 || !requisitionid || !departmentid) {
        throw new Error("Invalid data provided");
      }

      const totalServed = data.reduce((acc, item) => acc + item.served, 0);
      if (totalServed !== approvedQty) {
        return "MISMATCH";
      }

      if (await this.checkStoreSuppliedAlready(requisitionid)) return "ALREADY SUPPLIED";
      const filterData = data.filter((item) => item.served > 0);

      const updated = await this.updateDeptReqtAfterSupplied(1, requisitionid);
      if (updated) {
        const results = await Promise.all(
          filterData.map(async (item, index) => {
            const { productordersid, stockid, brandid, batchnumber, served, type = "debit" } = item;

            const outcome = await this.addProductEscrow({
              productordersid,
              stockid,
              brandid,
              batchnumber,
              served,
              type,
              requisitionid,
              departmentid,
            });
            return rowAffected(outcome);
          })
        );
        const passedCount = results.filter((value) => value === true).length;
        return passedCount === filterData.length ? "PASSED" : "FAILED";
      } else {
        await this.updateDeptReqtAfterSupplied(0, requisitionid);
        return "FAILED";
      }
    } catch (err) {
      await this.updateDeptReqtAfterSupplied(0, requisitionid);
      await promisifyQuery(q_delete_requit_from_escrow, [requisitionid]);
      logger.error(err);
      throw new Error(err);
    }
  }

  async updateRequisitionApproval(reqdata: UpdateReqtData): Promise<boolean> {
    const { quantity, requisitionid, status } = reqdata;
    if (!requisitionid || !status) {
      throw new Error("requisitionid && status is required");
    }
    if (isNaN(requisitionid) || isNaN(quantity)) {
      throw new Error("valid integers required");
    }
    if (quantity < 0) return false;
    const result = await promisifyQuery(q_update_dept_requisition, [quantity, status, requisitionid]);
    return rowAffected(result);
  }

  async updateDeptReqtAfterSupplied(store_supplied: number, requisitionid: number) {
    if (typeof store_supplied == "string") {
      throw TypeError("store_supplied must be a number");
    }

    if (store_supplied < 0 || !requisitionid) throw new Error("int store_supplied and requisitionid  required");
    const values = [store_supplied, requisitionid];

    return rowAffected(await promisifyQuery(q_update_dept_requisition_after_supplied, values));
  }

  async updateQtyDeptReceived(reqdata: updateQtyDeptReceived) {
    const { quantityReceived, departmentReceived, status, employeeid, requisitionid } = reqdata;
    const values = [quantityReceived, departmentReceived, status, employeeid, requisitionid];
    return rowAffected(await promisifyQuery(q_updateQtyDeptReceived, values));
  }

  async isDeptHaveStockBrand(stockid: number, brandid: number, batchnumber: string | number) {
    const count = await promisifyQuery(q_do_dept_have_Stock_brand, [stockid, brandid, batchnumber]);
    return count.length > 0;
  }

  async getDeptHaveStockBrand(stockid: number, brandid: number, batchnumber: string | number, LIMIT: number) {
    const rows = await promisifyQuery(q_get_dept_stock_brand, [stockid, brandid, batchnumber, LIMIT]);
    return rows;
  }

  async insertDeptMainStockSupply(records: DepartMain): Promise<boolean> {
    const { qty, stockid, brandid, batchnumber, departmentid } = records;
    return rowAffected(await promisifyQuery(q_insertDeptMainStockSupply, [qty, stockid, brandid, batchnumber, departmentid]));
  }

  async updateDepartmentMainStocks(records: DepartMain, arithmetric = "add") {
    const { stockid, brandid, batchnumber, qty } = records;

    if (await this.isDeptHaveStockBrand(stockid, brandid, batchnumber)) {
      const info = await this.getDeptHaveStockBrand(stockid, brandid, batchnumber, 1);
      const current_qty = info[0]["quantity"];
      const updated_qty = arithmetric === "add" ? parseInt(current_qty) + qty : parseInt(current_qty) - qty;

      return await promisifyQuery(q_departmentsmainsupply, [updated_qty, stockid, brandid, batchnumber]);
    } else {
      await this.insertDeptMainStockSupply(records);
    }
  }

  protected async deleteRequisition(requisitionid: number) {
    const packet = await promisifyQuery(q_delete_requisition_query, [requisitionid]);
    return rowAffected(packet);
  }

  async updateReqtAfterReceivedDept(records) {
    const { quantityReceived, departmentReceived, id, status, employeeid, departmentid, stockid } = records;

    if (!quantityReceived || !departmentReceived || !id || !employeeid || !departmentid) {
      throw new Error("quantityReceived, departmentReceived, requisitionid, departmentid status and employee id required");
    }

    let esrow = new Escrow(id);

    let esrowItems = await esrow.getEsrowReqt();

    if (esrowItems.length <= 0) {
      await this.deleteRequisition(id);
      return "NO ITEM IN ESCROW";
    }

    function isToday(dateString: string) {
      const today: Date = new Date();
      const itemDate = new Date(dateString);
      return (
        itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear()
      );
    }
    // check validity of esrow, must be pending and the addedon must be equal to today
    // Filter esrowItems based on the condition
    esrowItems = esrowItems.filter((item) => item?.status === "pending" && isToday(item?.addedon));
    // Check if there are any items left, if empty, meaning escrow time elapsed, we delete the requisition
    //  and allow for new requisiitons to be made
    if (esrowItems.length === 0) {
      esrow.updateEscrow(id, "canceled");
      // delete requisition
      await this.deleteRequisition(id);
      return "EXPIRED ESROW TIME, REQUEST AGAIN";
    }

    try {
      await this.updateQtyDeptReceived({ quantityReceived, departmentReceived, status, employeeid, requisitionid: id });
      await esrow.updateEscrow(id, "received");
      // ---NOTE-- functions below have been implemented with triggers to avoid lock deadlock issues with transactions
      // await this.updateDepartmentMainStocks(item)
      // await wastage.updateMainSupplyGeneral(stockid, brandid, qty, "minus")
      // await wastage.updateGeneralStocksQty(qty, stockid);
      return "UPDATE SUCCESSFUL";
    } catch (error) {
      logger.error(error);
      throw new Error(error);
    }
  }

  async getDepartmentBrandBatch(stockid: number, departmentid: number): Promise<[]> {
    try {
      if (!stockid || !departmentid) {
        throw new Error("stockid and departmentid are required");
      }
      const values = [stockid, departmentid];
      let result = await promisifyQuery(q_getDepartmentBrandBatch, values);
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getDepartmentExpired(departmentid: number): Promise<[]> {
    if (!departmentid) throw new Error("departmentid is required");
    const result = await promisifyQuery(q_getDepartmentExpired, [departmentid, departmentid]);
    return result;
  }
}


