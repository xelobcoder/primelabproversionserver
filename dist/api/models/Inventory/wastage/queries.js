"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECT_DEPT_QUARTERLY_DATA_QUERY = exports.SELECT_DEPT_MONTHLY_SUMMARY_QUERY = exports.SELECT_MONTHLY_SUMMARY_QUERY = exports.SELECT_QUARTERLY_DATA_QUERY = exports.UPDATE_DEPT_PRODUCT_DISPOSE_QUERY = exports.SELECT_WASTAGE_DEBIT_HX_QUERY = exports.UPDATE_ORDERS_WASTAGE_QUERY = exports.SELECT_ORDER_WASTAGE_DATA_QUERY = exports.SELECT_PRODUCT_INSTOCK_QUERY = void 0;
exports.SELECT_PRODUCT_INSTOCK_QUERY = `
  SELECT quantity as qty 
  FROM mainstoresupply  
  WHERE stockid = ? AND batchnumber = ? AND brandid  = ?
`;
exports.SELECT_ORDER_WASTAGE_DATA_QUERY = `
  SELECT * 
  FROM generalstoredebithx 
  WHERE stockid = ? AND brandid  = ? AND batchnumber = ?  AND wastage = 1
`;
exports.UPDATE_ORDERS_WASTAGE_QUERY = `
  UPDATE orders 
  SET expiredDisposed = ?, disposaldate = NOW() 
  WHERE productordersid = ?
`;
exports.SELECT_WASTAGE_DEBIT_HX_QUERY = `
  SELECT * 
  FROM generalstoredebithx 
  WHERE wastage = 1 AND productordersid = ?
`;
exports.UPDATE_DEPT_PRODUCT_DISPOSE_QUERY = `
  UPDATE departmentsmainsupply 
  SET expiredDisposed = ?, disposaldate = NOW(), quantity = 0, employeeid = ? 
  WHERE departmentid = ? AND batchnumber = ? AND brand = ? AND stockid = ?
`;
exports.SELECT_QUARTERLY_DATA_QUERY = `
  SELECT 
    sb.brand,
    dhx.batchnumber,
    o.name,
    o.expirydate,
    MONTH(dhx.debitdate) AS month,
    dhx.debitdate,
    o.receiveddate,
    o.pricing,
    o.price,
    dhx.debitqty,
    CASE
      WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
      WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
    END AS debitAmount
  FROM generalstoredebithx AS dhx 
  INNER JOIN orders AS o ON o.productordersid = dhx.productordersid 
  INNER JOIN stocksbrands AS sb ON sb.brandid = dhx.brandid
  WHERE dhx.wastage = 1
`;
exports.SELECT_MONTHLY_SUMMARY_QUERY = `
  SELECT 
    MONTH(dhx.debitdate) AS month,
    CASE
      WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
      WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
    END AS debitAmount
  FROM generalstoredebithx AS dhx 
  INNER JOIN orders AS o ON o.productordersid = dhx.productordersid 
  INNER JOIN stocksbrands AS sb ON sb.brandid = dhx.brandid
  WHERE dhx.wastage = 1
`;
exports.SELECT_DEPT_MONTHLY_SUMMARY_QUERY = `
  SELECT 
    CASE
      WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
      WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
    END AS debitAmount,
    MONTH(dchx.date) AS month
  FROM departmentconsumptionhx AS dchx 
  INNER JOIN orders AS o ON dchx.stockid = o.stockid AND dchx.batchnumber = o.batchnumber AND dchx.brand = o.brand
  INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
  WHERE dchx.wastage = 1 AND dchx.department = ?
`;
exports.SELECT_DEPT_QUARTERLY_DATA_QUERY = `
  SELECT 
    sb.brand,
    dchx.batchnumber,
    o.name,
    o.expirydate,
    MONTH(dchx.date) AS month,
    dchx.date AS debitdate,
    o.pricing,
    o.price,
    dchx.debit as debitqty,
    CASE
      WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
      WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
    END AS debitAmount
  FROM departmentconsumptionhx AS dchx 
  INNER JOIN orders AS o ON dchx.stockid = o.stockid AND dchx.batchnumber = o.batchnumber AND dchx.brand = o.brand
  INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
  WHERE dchx.wastage = 1 AND dchx.department = ?
`;
