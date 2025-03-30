"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allFieldsHasValues = exports.getCategory = exports.postCategory = exports.putCategory = exports.deleteCategory = void 0;
const logger_1 = __importDefault(require("../../logger"));
const helper_1 = require("../../helper");
// Ensure all fields are not empty
/**
 *
 * @param {Request} req
 * @returns {boolean|array} boolean value or an array of values
 */
function allFieldsHasValues(req) {
    // Grab all values of request body
    const values = Object.values(req.body).filter((value) => value === "");
    // Return true if all values are present
    return values.length === 0;
}
exports.allFieldsHasValues = allFieldsHasValues;
// Validate absence of such category
async function categoryExists(category) {
    const packets = await (0, helper_1.promisifyQuery)(`SELECT * FROM test_categories WHERE CATEGORY = ?`, [category]);
    return packets.length > 0;
}
const postCategory = async (req, res) => {
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
            }
            else {
                // Insert category into database
                const mysqlQuery = `INSERT INTO test_categories (CATEGORY, DESCRIPTION) VALUES (?, ?)`;
                await (0, helper_1.promisifyQuery)(mysqlQuery, [req.body.category, req.body.description]);
                res.status(201).send({
                    statusCode: 201,
                    status: "success",
                    message: "Category created successfully",
                });
            }
        }
        catch (err) {
            logger_1.default.error(err);
            res.status(500).send({ message: "Internal server error" });
        }
    }
    else {
        res.status(400).send({
            message: "All fields are required",
        });
    }
};
exports.postCategory = postCategory;
const getCategory = async (req, res) => {
    try {
        if (Object.keys(req.query).length > 0) {
            const { id } = req.query;
            // Determine if id is a number
            if (isNaN(Number(id))) {
                res.status(400).send({
                    message: "Id must be a number",
                });
            }
            else {
                // Query database for category with id
                const mysqlQuery = `SELECT * FROM test_categories WHERE ID = ?`;
                const result = await (0, helper_1.promisifyQuery)(mysqlQuery, [id]);
                res.send(result);
            }
        }
        else {
            const query = "SELECT * FROM test_categories";
            const result = await (0, helper_1.promisifyQuery)(query);
            res.send(result);
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
};
exports.getCategory = getCategory;
const putCategory = async (req, res) => {
    const { category, description } = req.body;
    const { id } = req.params;
    if (!category || !description) {
        res.status(400).send({
            message: "All fields are required",
        });
    }
    else {
        if (allFieldsHasValues(req)) {
            try {
                const mysqlQuery = `UPDATE test_categories SET CATEGORY = ?, DESCRIPTION = ? WHERE ID = ?`;
                await (0, helper_1.promisifyQuery)(mysqlQuery, [category, description, id]);
                res.send({
                    message: "Category updated successfully",
                });
            }
            catch (err) {
                logger_1.default.error(err);
                res.status(500).send({ message: "Internal server error" });
            }
        }
        else {
            res.status(400).send({
                message: "All fields must have values",
            });
        }
    }
};
exports.putCategory = putCategory;
const deleteCategory = async (req, res) => {
    try {
        if (Object.keys(req.query).length > 0) {
            const { id } = req.query;
            if (isNaN(Number(id))) {
                res.status(400).send({
                    message: "Id must be a number",
                });
            }
            else {
                const mysqlQuery = `DELETE FROM test_categories WHERE ID = ?`;
                await (0, helper_1.promisifyQuery)(mysqlQuery, [id]);
                res.send({
                    message: "Category deleted successfully",
                });
            }
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
};
exports.deleteCategory = deleteCategory;
