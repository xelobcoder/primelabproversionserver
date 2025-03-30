const logger = require("../../logger");
const connection = require("../db");
// ensure all fields are not empty
/**
 *
 * @param {request} req
 * @returns {boolean||array} boolean value or an array of values
 */
function allFieldsHasValues(request) {
  //   grap all values of request body
  let values = Object.values(request.body).filter((value, index) => {
    return value == "";
  });
  //   return true if all values are present
  return values.length == 0 ? true : false;
}

// validate absence of such category

function categoryExists(category, res) {
  return new Promise((resolve, reject) => {
    let mysqlQuery = `SELECT * FROM test_categories WHERE CATEGORY = '${category}'`;
    // execute query
    connection.query(mysqlQuery, (err, result) => {
      if (err) reject(err);
      //   if category exists return true
      if (result) {
        if (result.length > 0) {
          // category exists
          resolve(true);
        } else {
          // category does not exist
          resolve(false);
        }
      }
    });
  });
}

const postCategory = (request, response) => {
  // check if all fields are not empty
  if (allFieldsHasValues(request)) {
    // check if category exists
    categoryExists(request.body.category)
      .then((result) => {
        if (result) {
          response.status(409).send({
            statusCode: 409,
            message: "Category already exists",
          });
        } else {
          // insert category into database
          let mysqlQuery = `INSERT INTO test_categories (CATEGORY,DESCRIPTION) VALUES 
          ('${request.body.category}','${request.body.description}')`;
          connection.query(mysqlQuery, (err, result) => {
            if (err) { logger.error(err) };
            if (result) {
              response.status(201).send({
                // success message for category creation
                statusCode: 201,
                status: "success",
                message: "Category created successfully",
              });
            }
          });
        }
      })
      .catch((err) => {
        logger.error(err);
      });
  } else {
    res.status(400).send({
      message: "All fields are required",
    });
  }
};

const getCategory = (request, response) => {
  // determine if querie params exist
  if (Object.keys(request.query).length > 0) {
    const { id } = request.query;
    //    determine if id is a number
    if (isNaN(id)) {
      response.status(400).send({
        message: "Id must be a number",
      });
    } else {
      // query database for category with id
      let mysqlQuery = `SELECT * FROM test_categories WHERE ID = ${id}`;
      //   query database for category with id
      connection.query(mysqlQuery, (err, result) => {
        if (err) {
          logger.error(err);
        }
        response.send(result);
      });
    }
  } else {    
    let query = "SELECT * FROM test_categories";
    // execute query
    connection.query(query, (err, result) => {
      if (err) {
        logger.error(err);
      }
      response.send(result);
    });
  }
};
const putCategory = (request, response) => {
  const { category, description } = request.body;

  if (!category || !description) {
    response.send({
      message: "All fields are required",
    });
  }

  if (category && description) {
    if (allFieldsHasValues(request.body)) {
      let mysqlQuery = `UPDATE test_categories
            SET CATEGORY = '${category}', 
            DESCRIPTION = '${description}' 
            WHERE ID = ${request.params.id}`;
      connection.query(mysqlQuery, (err, result) => {
        if (err) { logger.error(err) };
        if (result) {
          response.send({
            message: "Category updated successfully",
          });
        }
      });
    } else {
      response.send({
        message: "All fields must have values",
      });
    }
  }
};
const deleteCategory = (request, response) => {
  if (Object.keys(request.query).length > 0) {
    const { id } = request.query;
    if (isNaN(id)) {
      response.status(400).send({
        message: "Id must be a number",
      });
    } else {
      let mysqlQuery = `DELETE FROM test_categories WHERE ID = ${id}`;
      connection.query(mysqlQuery, (err, result) => {
        if (err) { logger.error(err) };
        if (result) {
          response.send({
            message: "Category deleted successfully",
          });
        }
      });
    }
  }
};

module.exports = {
  deleteCategory,
  putCategory,
  postCategory,
  getCategory,
  allFieldsHasValues,
};
