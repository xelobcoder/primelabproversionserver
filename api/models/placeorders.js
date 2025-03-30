const { promisifyQuery, customError, rowAffected, paginationQuery } = require('../../helper');
const logger = require('../../logger');
const connection = require('../db');
const Inventory = require('./Inventory/inventoryclass');


class Orders extends Inventory {
  constructor(stockid,orderid) {
    super(stockid);
    this.orderid = orderid;
  }
}


const placeOrder = async function (request, response) {
  let successCount = 0;
  let errorCount = 0;
  let Exit = [];
  // check if order exist and items are recieved 
  // if not recieved then update the order, then we notify the front end of order status
  // if recieved then we notify the front end of order status
  // if not available , insert into the database 
  const addNewOrder = async (orderTransactionid, item) => {
    const { quantity, stockid, name, suppliername, supplierid, purchaseunit } = item;
    let query = `INSERT INTO orders (quantity, stockid, name, suppliername, supplierid, purchaseunit,orderTransactionid)
       VALUES (?,?,?,?,?,?,?)`;
    let values = [
      quantity,
      stockid,
      name,
      suppliername,
      supplierid,
      purchaseunit,
      orderTransactionid,
    ];
    return promisifyQuery(query, values);
  }

  const checkOrderExist = async (item) => {
    const { supplierid, stockid } = item;
    // select where stockid = stockid , received = false and supplierid = supplierid
    const query = `SELECT COUNT(*) AS count FROM orders WHERE stockid = ? AND  received = ? AND supplierid = ?`;
    const values = [stockid, "FALSE", supplierid];
    return promisifyQuery(query, values);
  }

  const { stock } = request.body;
  // create a unique id that runs for that product for this session
  const orderTransactionid = Date.now();
  // for length is greater than 0 zero, loop ,check if exist and added if none
  if (Array.isArray(stock) && stock.length > 0) {
    let counter = 0;
    stock.forEach(async (item, index) => {
      try {
        let present = await checkOrderExist(item, orderTransactionid);
        let count = present[0]?.count;
        if (present && count > 0) {
          Exit.push(item)
        } else {
          let added = await addNewOrder(orderTransactionid, item);
          const affectedRows = added?.affectedRows;
          if (affectedRows === 1) successCount++;
        };
      } catch (err) {
        logger.error(err);
        errorCount++;
      }
      counter++;
      if (counter === stock.length) {
        let responseString = ``;
        Exit.forEach((item, index) => {
          const { suppliername, name, stockid } = item;
          responseString += `${name} with stockid ${stockid} request to ${suppliername} was earlier on requested but remained unresolved,hence not added ,`;
        });
        response.send({
          statusCode: 200,
          status: "success",
          clear: Exit.length,
          message: `${successCount} items successfully requested.${errorCount}  error occured. ${responseString}`,
        });
      }
    })
  }
}


const getOrders = async function (request, response) {
  const { orderTransactionid, includebrands } = request.query;
  const queryValues = [];
  let query = `SELECT * FROM orders WHERE received = 'FALSE'`;
  if (orderTransactionid) {
    query += ` AND orderTransactionid = ?`
    queryValues.push(orderTransactionid);
  }
  query += ` ORDER BY productordersid DESC LIMIT ? OFFSET ?`

  try {
    let result = {};
    result.products = await paginationQuery(request.query, query, queryValues);

    if (includebrands) {
      const getbrands = result.products.map((item, index) => item.stockid);

      if (getbrands.length > 0) {
      
        const stocksBrands = await promisifyQuery(`SELECT stockid,brandid,brand FROM stocksbrands WHERE Stockid IN (${getbrands.join(",")})`);
        
        result.stockBrands = stocksBrands;
      } else {
        result.stockBrands = [];
      }
    } 
    response.send({ result, status: 'success', statusCode: 200 })
  } catch (err) {
    customError(err, 500, response)
  }
}




const deleteAspecificOrder = function (orderid, response) {
  // creat a query 
  const query = `DELETE FROM orders WHERE productordersid = ?`;
  // execute the query
  connection.query
    (
      query,
      [orderid],
      function (err, result) {
        if (err) {
          console.log(err)
          response.send({
            status: 'error',
            err,
          })
        }
        if (result) {
          response.send({
            status: 'success',
            message: 'order deleted successfully',
            statusCode: 200,
          })
        }
      }
    )
}

const updateStock = async function (stockid, planned, request, response) {
  return new Promise((resolve, reject) => {
    // get the current stock quantity
    const query = `SELECT * FROM generalstocks WHERE stockid = ?`;
    connection.query(query, [stockid], function (err, result) {
      if (err) {
        reject(err)
      }
      if (result) {
        const { stockid, quantity } = result[0];
        const updatedQuantity = parseInt(quantity) + parseInt(planned);
        const query = `UPDATE generalstocks SET quantity = ? WHERE stockid = ?`;
        connection.query(query, [updatedQuantity, stockid], function (err, result) {
          if (err) {
            reject(err)
          }
          if (result) {
            resolve(result)
          }
        })
      }
    })
  })
}



const updateOrders = function (data) {
  const query = `UPDATE orders SET received = ?, quantityReceived = ?, receiveddate = ?, status = ?, expirydate = ?,
   batchnumber = ?, balance = ?,brand = ? , price = ?, totalamount = ? WHERE productordersid = ? AND orderTransactionid = ? AND stockid =?`;
  return promisifyQuery(query, data);
}


const addToStockTransactions = async function (data) {
  if (Array.isArray(data) && data.length > 0) {
    //  data in the arranged in this format i.e stockid,quantity,batchno,purchaseunit,supplierid
    // insert into stocktransactions
    const query = `INSERT INTO stocktransactions (stockid,quantity,batchno,purchaseunit,supplierid,added_on)
     VALUE (?, ?, ?, ?, ?, NOW())`;
    connection.query(query, data, function (err, result) {
      if (err) {
        logger.error(err);
      }
      if (result) {
        console.log('stock transaction added successfully')
      }
    })
  }
}

const updateOrderReceivedTransactionSummary = async function (summary) {
  const { orderTransactionid, method, amount, total } = summary;
  if (parseFloat(amount) < 0 || 
  parseFloat(total) < 0 ||!orderTransactionid) return false;
  const query = `UPDATE orderreceivedaccountsummary SET method  = ?,debit = ?, taxAmount = ?,updatedOn=NOW()  WHERE orderTransactionid = ?`
  const values = [method, total, amount, orderTransactionid];
  rowAffected(await promisifyQuery(query, values));
}






module.exports = { placeOrder, getOrders, deleteAspecificOrder }