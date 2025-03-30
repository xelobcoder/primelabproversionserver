import { Request, Response } from "express";
import logger from "../../logger";
import { promisifyQuery } from "../../helper";

// Ensure all fields are not empty
/**
 *
 * @param {Request} req
 * @returns {boolean|array} boolean value or an array of values
 */
function allFieldsHasValues(req: Request): boolean {
  // Grab all values of request body
  const values = Object.values(req.body).filter((value) => value === "");
  // Return true if all values are present
  return values.length === 0;
}

// Validate absence of such category
async function categoryExists(category: string): Promise<boolean> {
  const packets = await promisifyQuery(`SELECT * FROM test_categories WHERE CATEGORY = ?`, [category]);
  return packets.length > 0;
}

const postCategory = async (req: Request, res: Response) => {
  // Check if all fields are not empty
  if (allFieldsHasValues(req)) {
    try {
      // Check if category exists
      const exists = await categoryExists(req.body.category);
      if (exists) {
        res.status(409).send({
          statusCode: 409,
          message: "Category already exists",
        });
      } else {
        // Insert category into database
        const mysqlQuery = `INSERT INTO test_categories (CATEGORY, DESCRIPTION) VALUES (?, ?)`;
        await promisifyQuery(mysqlQuery, [req.body.category, req.body.description]);
        res.status(201).send({
          statusCode: 201,
          status: "success",
          message: "Category created successfully",
        });
      }
    } catch (err) {
      logger.error(err);
      res.status(500).send({ message: "Internal server error" });
    }
  } else {
    res.status(400).send({
      message: "All fields are required",
    });
  }
};

const getCategory = async (req: Request, res: Response) => {
  try {
    if (Object.keys(req.query).length > 0) {
      const { id } = req.query;
      // Determine if id is a number
      if (isNaN(Number(id))) {
        res.status(400).send({
          message: "Id must be a number",
        });
      } else {
        // Query database for category with id
        const mysqlQuery = `SELECT * FROM test_categories WHERE ID = ?`;
        const result = await promisifyQuery(mysqlQuery, [id]);
        res.send(result);
      }
    } else {
      const query = "SELECT * FROM test_categories";
      const result = await promisifyQuery(query);
      res.send(result);
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send({ message: "Internal server error" });
  }
};

const putCategory = async (req: Request, res: Response) => {
  const { category, description } = req.body;
  const { id } = req.params;

  if (!category || !description) {
    res.status(400).send({
      message: "All fields are required",
    });
  } else {
    if (allFieldsHasValues(req)) {
      try {
        const mysqlQuery = `UPDATE test_categories SET CATEGORY = ?, DESCRIPTION = ? WHERE ID = ?`;
        await promisifyQuery(mysqlQuery, [category, description, id]);
        res.send({
          message: "Category updated successfully",
        });
      } catch (err) {
        logger.error(err);
        res.status(500).send({ message: "Internal server error" });
      }
    } else {
      res.status(400).send({
        message: "All fields must have values",
      });
    }
  }
};

const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (Object.keys(req.query).length > 0) {
      const { id } = req.query;
      if (isNaN(Number(id))) {
        res.status(400).send({
          message: "Id must be a number",
        });
      } else {
        const mysqlQuery = `DELETE FROM test_categories WHERE ID = ?`;
        await promisifyQuery(mysqlQuery, [id]);
        res.send({
          message: "Category deleted successfully",
        });
      }
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send({ message: "Internal server error" });
  }
};

export { deleteCategory, putCategory, postCategory, getCategory, allFieldsHasValues };
