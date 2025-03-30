const connection = require('../db')


const addNewDepartment = async function (request, response) {
  const { department, departmentManager, employeeid } = request.body;

  const sqlQuery = 'INSERT INTO departments (department, departmentManager, employeeid) VALUES (?, ?, ?)';
  const values = [department, departmentManager, employeeid];

  // Assuming you have already established a MySQL connection with the "connection" object
  connection.query(sqlQuery, values, (error, results) => {
    if (error) {
      response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Department not added',
        error,
      });
    } else {
      response.status(200).json({
        statusCode: 200,
        status: 'success',
        message: 'Department added successfully',
        data: results,
      });
    }
  });
};



const getDepartments = function (request, response) {
  const sqlQuery = 'SELECT * FROM departments ORDER BY id DESC LIMIT 50';
  connection.query(sqlQuery, function (error, results) {
    if (error) {
      response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Departments not fetched',
        error,
      });
    } else {
      response.status(200).json({
        statusCode: 200,
        status: 'success',
        message: 'Departments fetched successfully',
        data: results,
      });
    }
  });
};




const updateDepartment = function (request, response) {
  const { department, departmentManager, id, employeeid } = request.body;

  const sqlQuery = 'UPDATE departments SET department = ?, departmentManager = ?, employeeid = ? WHERE id = ?';
  const values = [department, departmentManager, employeeid, parseInt(id)];

  connection.query(sqlQuery, values, (error, results) => {
    if (error) {
      response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Department not updated',
        error,
      });
    } else {
      response.status(200).json({
        statusCode: 200,
        status: 'success',
        message: 'Department updated successfully',
        data: results,
      });
    }
  });
};



const deleteDepartment = function (request, response) {
  const { id } = request.body;

  const sqlQuery = 'DELETE FROM departments WHERE id = ?';
  const values = [parseInt(id)];

  connection.query(sqlQuery, values, (error, results) => {
    if (error) {
      response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Department not deleted',
        error,
      });
    } else {
      response.status(200).json({
        statusCode: 200,
        status: 'success',
        message: 'Department deleted successfully',
        data: results,
      });
    }
  });
};





const getSpecificDepartment = function (request, response) {
  const { id } = request.params;

  const sqlQuery = 'SELECT * FROM departments WHERE id = ?';
  const values = [parseInt(id)];

  connection.query(sqlQuery, values, (error, results) => {
    if (error) {
      console.log(error);
      response.status(500).json({
        statusCode: 500,
        status: 'error',
        message: 'Department not retrieved',
        error,
      });
    } else {
      response.status(200).json({
        statusCode: 200,
        status: 'success',
        message: 'Department retrieved successfully',
        department: results,
      });
    }
  });
};

module.exports = {
  addNewDepartment,
  getDepartments,
  deleteDepartment,
  updateDepartment,
  getSpecificDepartment
}