"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_purchasetoConsumeInsight = exports.q_debiting_stock = exports.updateStockOrderQuery = exports.FILTERSTOCKQUERY = exports.DELETEASTOCKQUERY = exports.UPDATEASTOCKQUERY = exports.GENERALUNEXPIREDSTOCKS = exports.EXPIREDPRODUCTSMINI = exports.EXPIREDSTOCKSQUERY = exports.GETGENERALSTOCK = exports.DELETESTOCKABRANDQUERY = exports.NEWSTOCKQUERY = void 0;
exports.NEWSTOCKQUERY = `INSERT INTO generalstocks (name,category,consumptionunit,purchaseunit,quantity,alertlevel,materialcode,warehouse,shelf) VALUES (?,?,?,?,?,?,?,?,?)`;
exports.DELETESTOCKABRANDQUERY = "DELETE FROM stocksbrands WHERE stockid = ? && brandid = ?";
exports.GETGENERALSTOCK = ` SELECT 
                      ns.name as name,
                      ns.stockid as stockid,
                      sc.category as categoryname,
                      ns.consumptionunit as consumptionunit,
                      ns.purchaseunit as purchaseunit,
                      ns.quantity as quantity,
                      ns.date as date,
                      wc.id as warehouse,
                      sc.id as category,
                      sh.id as shelf,
                      ns.alertlevel as alertlevel,
                      ns.materialcode as materialcode
                      FROM generalstocks AS ns INNER JOIN stockcategory AS sc ON sc.id = ns.category
                      INNER JOIN warehouse AS wc ON ns.warehouse = wc.id
                      INNER JOIN shelves AS sh ON sh.id = ns.shelf`;
exports.EXPIREDSTOCKSQUERY = `SELECT o.productordersid,s.brand, o.stockid, o.quantity, o.expirydate, o.received, o.receiveddate, o.expirydate, o.Batchnumber,s.brandid, o.name, o.suppliername, o.purchaseunit FROM orders AS o INNER JOIN stocksbrands AS s
ON o.brand = s.brandid
 WHERE o.RECEIVED = 'TRUE' AND DATE(o.expirydate) < CURRENT_DATE AND o.expiredDisposed IS NULL ORDER BY o.expirydate ASC LIMIT ? OFFSET ?`;
exports.EXPIREDPRODUCTSMINI = `SELECT productordersid FROM orders WHERE RECEIVED = 'TRUE' AND DATE(expirydate) < DATE(NOW())`;
exports.GENERALUNEXPIREDSTOCKS = `SELECT * FROM generalstocks WHERE expirydate >= NOW() AND status = 'received' ORDER BY productordersid LIMIT ? OFFSET ?`;
exports.UPDATEASTOCKQUERY = `UPDATE generalstocks SET  consumptionunit = ?,  purchaseunit = ?,  alertlevel = ?,  materialcode = ?,  date = ?,  name = ?,  category = ?,warehouse = ? , shelf = ? WHERE stockid = ?`;
exports.DELETEASTOCKQUERY = `DELETE FROM newstock WHERE stockid = ?`;
exports.FILTERSTOCKQUERY = `SELECT 
        gs.stockid,
        gs.name,
        gs.date,
        sc.category,
        gs.consumptionunit,
        gs.alertlevel,
        sc.category AS categoryname,
        gs.quantity
    FROM generalstocks AS gs
    INNER JOIN stockcategory AS  sc ON sc.id = gs.category
    WHERE gs.name  LIKE ? OR sc.category LIKE ? `;
exports.updateStockOrderQuery = `UPDATE orders
              SET received = ?,
                  quantityReceived = ?,
                  receiveddate = ?,
                  status = ?,
                  expirydate = ?,
                  batchnumber = ?,
                  balance = ?,
                  brand = ? ,
                  price = ?,
                  totalamount = ? 
              WHERE productordersid = ?
              AND orderTransactionid = ? 
              AND stockid =?`;
exports.q_debiting_stock = `SELECT DISTINCT
              chx.credit,
              chx.id AS creditid,
              chx.productordersid,
              chx.stockid,
              chx.brandid,
              chx.batchnumber,
              stb.brand,
              dhx.debitqty
      FROM  generalstoredebithx AS dhx INNER JOIN generalstorecredithx
      AS chx ON chx.productordersid = dhx.productordersid
      INNER JOIN stocksbrands AS stb ON stb.brandid = chx.brandid
      WHERE chx.stockid = ?  AND dhx.wastage = 0 AND  chx.brandid IN ({list}) GROUP BY chx.productordersid, chx.batchnumber,chx.brandid ,chx.stockid`;
exports.q_purchasetoConsumeInsight = `SELECT 
                  date as orderdate,
                  productordersid,
                  receiveddate,
                  batchnumber,
                  brand,
                  stockid,
    DATEDIFF(date,receiveddate) as pt_to_grn FROM orders WHERE stockid = ? 
    AND received = 'TRUE' ORDER BY productordersid DESC LIMIT ?`;
