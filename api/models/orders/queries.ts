export const q_addNewOrder = `
  INSERT INTO orders (quantity, stockid, name, suppliername, supplierid, purchaseunit, orderTransactionid,requestedby)
  VALUES (?,?,?,?,?,?,?,?)
`;

export const q_checkOrderExist = `
  SELECT COUNT(*) AS count FROM orders WHERE stockid = ? AND received = ? AND supplierid = ?
`;

export const q_getOrders = `
  SELECT * FROM orders WHERE received = 'FALSE'
`;

export const q_updateStock = `
  SELECT * FROM generalstocks WHERE stockid = ?
`;

export const q_updateGeneralStocks = `
  UPDATE generalstocks SET quantity = ? WHERE stockid = ?
`;

export const q_deleteOrder = `
  DELETE FROM orders WHERE productordersid = ?
`;

export const q_updateOrders = `
  UPDATE orders SET received = ?, quantityReceived = ?, receiveddate = ?, status = ?, expirydate = ?,
  batchnumber = ?, balance = ?, brand = ?, price = ?, totalamount = ? 
  WHERE productordersid = ? AND orderTransactionid = ? AND stockid = ?
`;

export const q_addToStockTransactions = `
  INSERT INTO stocktransactions (stockid, quantity, batchno, purchaseunit, supplierid, added_on)
  VALUES (?, ?, ?, ?, ?, NOW())
`;

export const q_getStockBrands = `
  SELECT stockid, brandid, brand FROM stocksbrands WHERE stockid IN (?)
`;

export const q_updateOrderReceivedTransactionSummary = `
  UPDATE orderreceivedaccountsummary SET method = ?, debit = ?, taxAmount = ?, updatedOn = NOW() WHERE orderTransactionid = ?
`;



export const q_get_all_orders_transactions = `SELECT * FROM orders  
AS ord RIGHT JOIN roles AS rr ON rr.employeeid = ord.requestedby`;

// ord.requestedby, ord.orderTransactionid, ord.transactiondate, ord.receivedby;



export const q_get_transaction_items = `SELECT * FROM orders WHERE orderTransactionid = ?;`