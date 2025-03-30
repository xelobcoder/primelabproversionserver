"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_1 = require("../../../../helper");
const logger_1 = __importDefault(require("../../../../logger"));
const user_1 = __importDefault(require("../../../LobnosAuth/user"));
const DepartmentClass_1 = __importDefault(require("../../Departments/DepartmentClass"));
class Requisition extends DepartmentClass_1.default {
    constructor(requisitionid, departmentid) {
        super(departmentid);
        this.requisitionid = requisitionid;
    }
    async canRequestNew(stockid, departmentid) {
        if (!stockid || !departmentid) {
            throw new Error("departmentid and stockid are required");
        }
        const query = `
      SELECT * FROM departmentrequisition
      WHERE stockid = ? AND departmentid = ? AND quantity_approved IS NULL
    `;
        try {
            const result = await (0, helper_1.promisifyQuery)(query, [stockid, departmentid]);
            return result.length === 0;
        }
        catch (error) {
            logger_1.default.error(error);
            throw new Error(error);
        }
    }
    async newDepartmentRequisition(records) {
        try {
            const { stockid, departmentid, quantity, comsumptionunit, employeeid } = records;
            const isNotEmptyFields = Object.values(records).filter((field) => {
                return field === "" || field === null;
            });
            if (isNotEmptyFields.length > 0) {
                throw (0, helper_1.customError)({ message: "all fields are required", statusCode: 404, response: null });
            }
            if (!(await this.canRequestNew(stockid, departmentid))) {
                return "requisition already made and unresolved";
            }
            const values = [stockid, departmentid, quantity, comsumptionunit, employeeid];
            const result = await (0, helper_1.promisifyQuery)(queries_1.NEW_DEPARTMENT_REQUISITION_QUERY, values);
            return (0, helper_1.rowAffected)(result) ? "requisition successful" : "requisition failed";
        }
        catch (err) {
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    async getDepartmentsRequisitions(queryset) {
        return (0, helper_1.paginationQuery)(queryset, queries_1.GET_DEPARTMENT_REQUISITIONS_QUERY);
    }
    async getDeptStocks(departmentid) {
        if (!departmentid) {
            throw new Error("departmentid required");
        }
        return await (0, helper_1.promisifyQuery)(queries_1.GET_DEPT_STOCKS_QUERY, [departmentid]);
    }
    async deleteDeptStocks(departmentid, employeeid) {
        if (!departmentid || !employeeid) {
            throw new Error("departmentid and employeeid required");
        }
        const role = await new user_1.default(null, null, null, null, null).getUserRole(employeeid);
        if (!role) {
            return "user not recognized";
        }
        if (role != "admin" && role != "manager") {
            return "user do not have permission to delete stocks";
        }
        return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(queries_1.DELETE_DEPT_STOCKS_QUERY, [departmentid]));
    }
    async consumeDepartmentStock(records) {
        const { employeeid, stockid, departmentid, consumeqty, batchnumber, brandid } = records;
        const stockdata = await (0, helper_1.promisifyQuery)(queries_1.CONSUME_DEPARTMENT_STOCK_QUERY, [stockid, departmentid, brandid, batchnumber]);
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
            await (0, helper_1.promisifyQuery)("START TRANSACTION");
            await (0, helper_1.promisifyQuery)(queries_1.UPDATE_DEPARTMENT_STOCK_QUERY, updateValues);
            const hxValues = [departmentid, stockid, batchnumber, brandid, conqty, employeeid];
            await (0, helper_1.promisifyQuery)(queries_1.INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY, hxValues);
            await (0, helper_1.promisifyQuery)("COMMIT");
            return true;
        }
        catch (err) {
            await (0, helper_1.promisifyQuery)("ROLLBACK");
            logger_1.default.error(err);
            throw new Error(err);
        }
    }
    async deleteUnAttendedRequistions() { }
}
exports.default = Requisition;
