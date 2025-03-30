const connection = require("../db");
const logger = require("../../logger");
const { promisifyQuery, customError } = require("../../helper");
const Inventory = require("./Inventory/inventoryclass");

/**
 * Handles a POST request to create a new department requisition.
 * 
 * @param {object} request - The HTTP request object containing the request body.
 * @param {object} response - The HTTP response object used to send the response back to the client.
 * @returns {void}
 */
// Summary
// This code defines a function called newdepartmentRequisition that handles a POST request to create a new department requisition. 
// It checks if all the required fields are provided in the request body, and if not, it sends an error response. 
// If all the fields are provided, it checks if the stock has already been requisitioned for the given department. 
// If it has, it sends a success response indicating that the stock has already been requisitioned. 
// If the stock has not been requisitioned, it inserts a new department requisition into the database and sends a success response with the inserted data.

//    Flow
// Destructure the stockid, departmentid, quantity, and comsumptionunit from the request body.
// Generate a unique requisitionid using the uuidv4 function.
// Check if any of the required fields in the request body are empty or null.
// If any of the required fields are empty or null, send a 400 error response indicating that all fields are required.
// If all the required fields are provided, check if the stock has already been requisitioned for the given department.
// If the stock has already been requisitioned, send a success response indicating that the stock has already been requisitioned.
// If the stock has not been requisitioned, insert a new department requisition into the database.
// Send a success response with the inserted data.
const newdepartmentRequisition = (request, response) => {
  const { stockid, departmentid, quantity, comsumptionunit, employeeid } = request.body;

  const isNotEmptyFields = Object.values(request.body).filter((field) => {
    return field === "" || field === null;
  });

  if (isNotEmptyFields.length > 0) return customError({ message: 'all fields are required', statusCode: 404, response });


  const checkIfStockIsAlreadyRequisitioned = async () => {
    const query = `SELECT * FROM departmentrequisition
       WHERE stockid = ? AND departmentid = ? AND quantity_approved IS NULL`;
    try {
      return await promisifyQuery(query, [stockid, departmentid]);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  checkIfStockIsAlreadyRequisitioned()
    .then((data) => {
      if (data.length > 0) {
        response.send({
          statusCode: 200,
          status: "success",
          message: "Stock has already been requisitioned",
        });
      } else {
        const newdepartmentRequisition = async () => {
          const sql_query = `INSERT INTO departmentrequisition
          (stockid, departmentid, quantity_requested, comsumptionunit,requestingemployee)
          VALUES (?,?,?,?,?,?)`;

          try {
            const result = await promisifyQuery(sql_query, [
              stockid,
              departmentid,
              quantity,
              comsumptionunit,
              employeeid
            ]);
            return result;
          } catch (error) {
            throw error;
          }
        };

        newdepartmentRequisition()
          .then((data) => {
            response.send({
              statusCode: 200,
              status: "success",
              message: "Department requisition added successfully",
              data,
            });
          })
          .catch((error) => {
            response.send({
              statusCode: 500,
              status: "error",
              message: "Department requisition not added",
              error,
            });
          });
      }
    })
    .catch((error) => {
      response.send({
        statusCode: 500,
        status: "error",
        message: "Error checking if stock is already requisitioned",
        error,
      });
    });
}
const getDepartmentsRequisitions = async function (request, response) {
  const query = `
    SELECT *
    FROM departmentrequisition
    ORDER BY id DESC
    LIMIT 20;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      logger.error('Error fetching department requisitions:', error);
      response.status(500).json({
        status: 'error',
        message: 'Failed to fetch department requisitions',
        data: error,
      });
    } else {
      response.status(200).json({
        status: 'success',
        message: 'Department requisitions retrieved successfully',
        data: results,
      });
    }
  });
};

const specificDepartmentRequisition = async function (request, response) {
  const { id, type } = request.query;
  // join department requisition table with  name of department  table and name of newstock table
  if (!id) return new Error('id required');

  let mysql_query = `SELECT  drh.id,
        drh.departmentid, 
        drh.stockid, 
        drh.quantity_requested,
        drh.quantity_approved,
        drh.status,
         drh.date,
         drh.requisitionid,
         drh.comsumptionunit,
         d.department,ns.stockid,
         ns.name,
         ns.quantity
         FROM departmentrequisition AS drh
        INNER JOIN departments AS d ON d.id = drh.departmentid
        INNER JOIN generalstocks AS ns ON ns.stockid = drh.stockid`


  if (type === "pending") {
    mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NULL `
  }

  if (type === "approved") {
    mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'approved'`
  }

  if (type === "rejected") {
    mysql_query += ` WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'rejected'`
  }

  if (type === "received") {
    mysql_query += `WHERE drh.departmentid = ? AND quantity_approved IS NOT NULL AND status = 'received'`
  }

  return promisifyQuery(mysql_query, [parseInt(id)]);
};


const patchRequisition = async function (request, response, requi_id) {
  // update the department requisition table with the quantity approved and the status=approved
  const { quantity_approved, store_supplied, brand, batchnumber } = request.body;
  const mysql_query = `UPDATE departmentrequisition
   SET quantity_approved = ?,
   store_supplied = ?,
   batchnumber = ?,
   brand = ?,
   status = 'approved' WHERE id = ?`;

  const values = [quantity_approved, store_supplied, batchnumber, brand, parseInt(requi_id)];

  if (departmentid) {
    response.send({
      status: "error",
      message: "required fields not included",
    });
  } else {
    connection.query(mysql_query, values, function (err, result) {
      if (err) {
        response.send({
          status: "error",
          message: err.message,
        });
      }

      if (result) {
        response.send({
          status: "success",
          message: "success",
          data: result,
          statusCode: 200,
        });
      }
    })
  }
}



const deleteDeptStocks = async function (request, response, id) {
  // delete stock from department stock table using the stockid
  const mysql_query = `DELETE FROM departmentstocks WHERE stockid = ${id}`;

  if (id === undefined || id === null) {
    response.send({
      status: "error",
      message: "stock id not included",
    });
  } else {
    connection.query(mysql_query, function (err, result) {
      if (err) {
        response.send({
          status: "error",
          message: err.message,
        });
      }

      if (result) {
        response.send({
          status: "success",
          message: "Stock deleted successfully",
          result,
        });
      }
    });
  }
};


// -------------------------

const updateRequisitionAfterReceivedDept = async function (request, response) {
  const { quantityReceived, departmentReceived, id, status, stockid, consumptionunit, departmentid, employeeid } = request.body;

  if (!quantityReceived || !departmentReceived || !id || !employeeid) {
    response.send({
      status: "error",
      message: "required fields not included",
      requiredfields: 'quantityReceived, departmentReceived, id, status, stockid, consumptionunit, departmentid, employeeid'
    });
  }
  else {
    // this updates `quantityReceived` and `departmentReceived` fields
    const update_query = `UPDATE departmentrequisition
       SET quantityReceived = ?, departmentReceived = ?, 
       status = ?, receivingemployee = ? WHERE id = ?`;

    const values = [quantityReceived, departmentReceived, status, employeeid, id];

    const { affectedRows } = await promisifyQuery(update_query, values);

    // rest of the funtions and jobs will be handled at the database level using triggers on department...hx table
    if (!affectedRows || affectedRows === 0) {
      customError('update failed', 500, response);
    } else {
      response.send({
        status: "success",
        message: "Department stocks successfully updated",
        statusCode: 200
      });
    }
  }
};


module.exports = {
  newdepartmentRequisition,
  getDepartmentsRequisitions,
  specificDepartmentRequisition,
  deleteDeptStocks,
  patchRequisition,
  updateRequisitionAfterReceivedDept,
  // generalStoreLotNo
};



