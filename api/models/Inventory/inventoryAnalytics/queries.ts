export const q_getCustomizationData = `
  SELECT * FROM inventorycustomization
`;

export const q_getNearExpiry = (count: boolean) => `
  SELECT DISTINCT ${
    count
      ? "COUNT(*) AS count"
      : "productordersid, name, receiveddate, expirydate, quantityReceived, expiredDisposed, batchnumber, brand, stockid"
  }
  FROM orders AS o
  WHERE o.status = 'received' AND DATEDIFF(o.expirydate, CURRENT_DATE()) < ? AND DATE(CURRENT_DATE) < DATE(o.expirydate)
`;

export const q_getBelowAlert = (count: boolean) => `
  SELECT ${count ? "COUNT(*) AS count" : "*"} FROM generalStocks WHERE quantity < alertlevel
`;

export const q_getExpiredCount = (count: boolean) => `
  SELECT ${
    count ? "COUNT(*) AS count" : "*"
  } FROM orders WHERE RECEIVED = 'TRUE' AND status = 'received' AND DATE(expirydate) < CURRENT_DATE
`;

export const q_getInvSummaryAnalytics = `
  SELECT * FROM inventoryanalyticssummary
`;

export const q_getIncompOrdersCount = (count:boolean) => `
  SELECT ${count ? "COUNT(*) AS count" : "*"} FROM orders WHERE received = 'FALSE'
`;

export const q_completeOrdersCount = (count: boolean) => `
  SELECT ${count ? "COUNT(*) AS count" : "*"} FROM orders WHERE received = 'TRUE'
`;

export const q_updateInvenAnalSummary = {
  update: `UPDATE inventoryanalyticssummary SET settings = ? WHERE id = 1`,
  insert: `INSERT INTO inventoryanalyticssummary (settings) VALUES (?)`,
};

export const q_getWastagePerQuarters = `
  SELECT dhx.productordersid,
         CASE
             WHEN o.pricing = 'unit' THEN (dhx.debitqty * o.price)
             WHEN o.pricing = 'absolute' THEN (dhx.debitqty + o.price) 
         END AS debitAmount,
         CASE
             WHEN MONTH(dhx.debitdate) BETWEEN 1 AND 4 THEN 1
             WHEN MONTH(dhx.debitdate) BETWEEN 5 AND 8 THEN 2
             WHEN MONTH(dhx.debitdate) BETWEEN 9 AND 12 THEN 3
         END AS quarter,
         o.pricing,
         o.quantityReceived,
         o.price,
         o.totalamount,
         dhx.wastage,
         dhx.debitqty,
         dhx.departmentid
  FROM generalstoredebithx AS dhx
       INNER JOIN orders AS o ON o.productordersid = dhx.productordersid
  WHERE dhx.wastage = 1
`;

export const q_getDepartmentWastageByQuartersSummary = `
  SELECT CASE
             WHEN o.pricing = 'unit' THEN (dchx.debit * o.price)
             WHEN o.pricing = 'absolute' THEN (dchx.debit + o.price) 
         END AS debitAmount,
         MONTH(dchx.date) AS month,
         CASE
             WHEN MONTH(dchx.date) BETWEEN 1 AND 4 THEN 1
             WHEN MONTH(dchx.date) BETWEEN 5 AND 8 THEN 2
             WHEN MONTH(dchx.date) BETWEEN 9 AND 12 THEN 3
         END AS quarter
  FROM departmentconsumptionhx AS dchx
       INNER JOIN orders AS o ON dchx.stockid = o.stockid
       INNER JOIN stocksbrands AS sb ON sb.brandid = dchx.brand
  WHERE dchx.wastage = 1
    AND department = ?
    AND o.stockid = dchx.stockid
    AND dchx.batchnumber = o.batchnumber
    AND dchx.brand = o.brand
  GROUP BY dchx.batchnumber, dchx.brand, dchx.stockid
`;
