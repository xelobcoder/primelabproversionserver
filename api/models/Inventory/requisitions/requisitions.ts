import {
  NEW_DEPARTMENT_REQUISITION_QUERY,
  GET_DEPARTMENT_REQUISITIONS_QUERY,
  GET_DEPT_STOCKS_QUERY,
  DELETE_DEPT_STOCKS_QUERY,
  CONSUME_DEPARTMENT_STOCK_QUERY,
  UPDATE_DEPARTMENT_STOCK_QUERY,
  INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY,
} from "./queries";
import { promisifyQuery, rowAffected, paginationQuery, customError } from "../../../../helper";
import logger from "../../../../logger";
import User from "../../../LobnosAuth/user";
import Departments from "../../Departments/DepartmentClass";

class Requisition extends Departments {
  private requisitionid: number;

  constructor(requisitionid: number, departmentid: number) {
    super(departmentid);
    this.requisitionid = requisitionid;
  }

  async canRequestNew(stockid: any, departmentid: any) {
    if (!stockid || !departmentid) {
      throw new Error("departmentid and stockid are required");
    }
    const query = `
      SELECT * FROM departmentrequisition
      WHERE stockid = ? AND departmentid = ? AND quantity_approved IS NULL
    `;
    try {
      const result = await promisifyQuery(query, [stockid, departmentid]);
      return result.length === 0;
    } catch (error) {
      logger.error(error);
      throw new Error(error);
    }
  }

  async newDepartmentRequisition(records: any) {
    try {
      const { stockid, departmentid, quantity, comsumptionunit, employeeid } = records;

      const isNotEmptyFields = Object.values(records).filter((field: any) => {
        return field === "" || field === null;
      });

      if (isNotEmptyFields.length > 0) {
        throw customError({ message: "all fields are required", statusCode: 404, response: null });
      }

      if (!(await this.canRequestNew(stockid, departmentid))) {
        return "requisition already made and unresolved";
      }

      const values = [stockid, departmentid, quantity, comsumptionunit, employeeid];
      const result = await promisifyQuery(NEW_DEPARTMENT_REQUISITION_QUERY, values);

      return rowAffected(result) ? "requisition successful" : "requisition failed";
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  }

  async getDepartmentsRequisitions(queryset: { count: number; page: number }) {
    return paginationQuery(queryset, GET_DEPARTMENT_REQUISITIONS_QUERY);
  }

  async getDeptStocks(departmentid: any) {
    if (!departmentid) {
      throw new Error("departmentid required");
    }
    return await promisifyQuery(GET_DEPT_STOCKS_QUERY, [departmentid]);
  }

  async deleteDeptStocks(departmentid: any, employeeid: any) {
    if (!departmentid || !employeeid) {
      throw new Error("departmentid and employeeid required");
    }

    const role = await new User(null, null, null, null, null).getUserRole(employeeid);

    if (!role) {
      return "user not recognized";
    }

    if (role != "admin" && role != "manager") {
      return "user do not have permission to delete stocks";
    }

    return rowAffected(await promisifyQuery(DELETE_DEPT_STOCKS_QUERY, [departmentid]));
  }

  async consumeDepartmentStock(records: any) {
    const { employeeid, stockid, departmentid, consumeqty, batchnumber, brandid } = records;

    const stockdata = await promisifyQuery(CONSUME_DEPARTMENT_STOCK_QUERY, [stockid, departmentid, brandid, batchnumber]);

    if (stockdata.length === 0) {
      return "No Found";
    }

    const prev = parseInt(stockdata[0]["quantity"]);
    const conqty = parseInt(consumeqty);
    const isOkay = prev >= conqty;

    if (!isOkay) {
      return "qty to be consumed must be less than qty available";
    }

    const balance = prev - conqty;
    const updateValues = [balance, departmentid, batchnumber, stockid, brandid];

    try {
      await promisifyQuery("START TRANSACTION");
      await promisifyQuery(UPDATE_DEPARTMENT_STOCK_QUERY, updateValues);
      const hxValues = [departmentid, stockid, batchnumber, brandid, conqty, employeeid];
      await promisifyQuery(INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY, hxValues);
      await promisifyQuery("COMMIT");
      return true;
    } catch (err) {
      await promisifyQuery("ROLLBACK");
      logger.error(err);
      throw new Error(err);
    }
  }

  async deleteUnAttendedRequistions() { }
}

export default Requisition;
