export const NEW_DEPARTMENT_REQUISITION_QUERY = `
  INSERT INTO departmentrequisition
  (stockid, departmentid, quantity_requested, comsumptionunit, requestingemployee)
  VALUES (?,?,?,?,?)
`;

export const GET_DEPARTMENT_REQUISITIONS_QUERY = `
  SELECT * FROM departmentrequisition ORDER BY id ASC LIMIT ? OFFSET ?
`;

export const GET_DEPT_STOCKS_QUERY = `
  SELECT np.stockid, np.name, ds.quantityAvailable, sc.category, np.consumptionunit
  FROM generalstocks AS np
  INNER JOIN departmentstocks AS ds ON np.stockid = ds.stockid
  INNER JOIN departments AS d ON d.id = ds.deptid
  INNER JOIN stockcategory AS sc ON sc.id = np.category
  WHERE ds.deptid = ?
`;

export const DELETE_DEPT_STOCKS_QUERY = `
  DELETE FROM departmentstocks WHERE stockid = ?
`;

export const CONSUME_DEPARTMENT_STOCK_QUERY = `
  SELECT * FROM departmentsmainsupply WHERE stockid = ? AND departmentid = ? AND brand = ? AND batchnumber = ?
`;

export const UPDATE_DEPARTMENT_STOCK_QUERY = `
  UPDATE departmentsmainsupply SET quantity = ?
  WHERE departmentid = ? AND batchnumber = ? AND stockid = ? AND brand = ?
`;

export const INSERT_DEPARTMENT_CONSUMPTION_HX_QUERY = `
  INSERT INTO departmentconsumptionhx (department, stockid, batchnumber, brand, debit, employeeid)
  VALUES (?,?,?,?,?,?)
`;
