"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_get_transaction_items = exports.q_get_all_orders_transactions = exports.q_updateOrderReceivedTransactionSummary = exports.q_getStockBrands = exports.q_addToStockTransactions = exports.q_updateOrders = exports.q_deleteOrder = exports.q_updateGeneralStocks = exports.q_updateStock = exports.q_getOrders = exports.q_checkOrderExist = exports.q_addNewOrder = void 0;
exports.q_addNewOrder = `
  INSERT INTO orders (quantity, stockid, name, suppliername, supplierid, purchaseunit, orderTransactionid,requestedby)
  VALUES (?,?,?,?,?,?,?,?)
`;
exports.q_checkOrderExist = `
  SELECT COUNT(*) AS count FROM orders WHERE stockid = ? AND received = ? AND supplierid = ?
`;
exports.q_getOrders = `
  SELECT * FROM orders WHERE received = 'FALSE'
`;
exports.q_updateStock = `
  SELECT * FROM generalstocks WHERE stockid = ?
`;
exports.q_updateGeneralStocks = `
  UPDATE generalstocks SET quantity = ? WHERE stockid = ?
`;
exports.q_deleteOrder = `
  DELETE FROM orders WHERE productordersid = ?
`;
exports.q_updateOrders = `
  UPDATE orders SET received = ?, quantityReceived = ?, receiveddate = ?, status = ?, expirydate = ?,
  batchnumber = ?, balance = ?, brand = ?, price = ?, totalamount = ? 
  WHERE productordersid = ? AND orderTransactionid = ? AND stockid = ?
`;
exports.q_addToStockTransactions = `
  INSERT INTO stocktransactions (stockid, quantity, batchno, purchaseunit, supplierid, added_on)
  VALUES (?, ?, ?, ?, ?, NOW())
`;
exports.q_getStockBrands = `
  SELECT stockid, brandid, brand FROM stocksbrands WHERE stockid IN (?)
`;
exports.q_updateOrderReceivedTransactionSummary = `
  UPDATE orderreceivedaccountsummary SET method = ?, debit = ?, taxAmount = ?, updatedOn = NOW() WHERE orderTransactionid = ?
`;
exports.q_get_all_orders_transactions = `SELECT * FROM orders  
AS ord RIGHT JOIN roles AS rr ON rr.employeeid = ord.requestedby`;
// ord.requestedby, ord.orderTransactionid, ord.transactiondate, ord.receivedby;
exports.q_get_transaction_items = `SELECT * FROM orders WHERE orderTransactionid = ?;`;
