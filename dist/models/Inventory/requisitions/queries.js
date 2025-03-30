"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY = exports.UPDATE_DEPARTMENT_STOCK_QUERY = exports.CONSUME_DEPARTMENT_STOCK_QUERY = exports.DELETE_DEPT_STOCKS_QUERY = exports.GET_DEPT_STOCKS_QUERY = exports.GET_DEPARTMENT_REQUISITIONS_QUERY = exports.NEW_DEPARTMENT_REQUISITION_QUERY = void 0;
exports.NEW_DEPARTMENT_REQUISITION_QUERY = `
  INSERT INTO departmentrequisition
  (stockid, departmentid, quantity_requested, comsumptionunit, requestingemployee)
  VALUES (?,?,?,?,?)
`;
exports.GET_DEPARTMENT_REQUISITIONS_QUERY = `
  SELECT * FROM departmentrequisition ORDER BY id ASC LIMIT ? OFFSET ?
`;
exports.GET_DEPT_STOCKS_QUERY = `
  SELECT np.stockid, np.name, ds.quantityAvailable, sc.category, np.consumptionunit
  FROM generalstocks AS np
  INNER JOIN departmentstocks AS ds ON np.stockid = ds.stockid
  INNER JOIN departments AS d ON d.id = ds.deptid
  INNER JOIN stockcategory AS sc ON sc.id = np.category
  WHERE ds.deptid = ?
`;
exports.DELETE_DEPT_STOCKS_QUERY = `
  DELETE FROM departmentstocks WHERE stockid = ?
`;
exports.CONSUME_DEPARTMENT_STOCK_QUERY = `
  SELECT * FROM departmentsmainsupply WHERE stockid = ? AND departmentid = ? AND brand = ? AND batchnumber = ?
`;
exports.UPDATE_DEPARTMENT_STOCK_QUERY = `
  UPDATE departmentsmainsupply SET quantity = ?
  WHERE departmentid = ? AND batchnumber = ? AND stockid = ? AND brand = ?
`;
exports.INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY = `
  INSERT INTO departmentconsumptionhx (department, stockid, batchnumber, brand, debit, employeeid)
  VALUES (?,?,?,?,?,?)
`;
