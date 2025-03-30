import { Request, Response } from "express";
import { customError, promisifyQuery, rowAffected } from "../../../helper";
import logger from "../../../logger";
import ApplicationSettings from "./appsettings/appset";
import { checkTaxNameExistQuery, addTaxQuery, getAllTaxesQuery, updateTaxQuery, changeTaxStatusQuery, deleteTaxQuery } from "./TQueries";
import { ITax } from "./Ttax";

export default class Tax extends ApplicationSettings implements ITax {
  constructor(id: number) {
    super();
  }

  async addTax(request: Request, response: Response): Promise<void> {
    const { value, name } = request.body;
    if (!name || !value) return customError("name and value required", 401, response);

    try {
      const existCount = await promisifyQuery(checkTaxNameExistQuery, name);

      if (Array.isArray(existCount) && existCount.length > 0) {
        response.send({
          message: "tax with such name available",
          status: "success",
          statusCode: 406,
        });
      } else {
        const result = await promisifyQuery(addTaxQuery, [name, value]);
        response.send({
          message: rowAffected(result) ? "tax added successfully" : "Error inserting new tax",
          status: "success",
          statusCode: 200,
        });
      }
    } catch (err) {
      logger.error(err);
      customError("error occurred", 500, response);
    }
  }

  async getTax(request: Request, response: Response): Promise<void> {
    try {
      const result = await promisifyQuery(getAllTaxesQuery);
      response.send({ status: "success", statusCode: 200, result });
    } catch (err) {
      logger.error(err);
      customError(err?.message, 500, response);
    }
  }

  async updateTax(request: Request, response: Response): Promise<void> {
    const { id, value, name } = request.body;
    if (!id || !value || !name) return customError("tax id, name and value are required", 404, response);

    try {
      const result = rowAffected(await promisifyQuery(updateTaxQuery, [name, value, id]));
      response.send({
        message: result ? "updated successfully" : "failed updating",
        status: result ? "success" : "failed",
      });
    } catch (err) {
      logger.error(err);
      customError("error occurred", 500, response);
    }
  }

  async changeTaxStatus(request: Request, response: Response): Promise<void> {
    const { id, status } = request.body;
    if (!id || typeof status !== "boolean") return customError("tax id and applystatus required", 404, response);

    const value = status ? "Yes" : "No";
    try {
      const result = rowAffected(await promisifyQuery(changeTaxStatusQuery, [value, id]));
      response.send({
        message: result ? "updated successfully" : "update failed",
        status: result ? "success" : "failed",
      });
    } catch (err) {
      logger.error(err);
      customError("error occurred", 500, response);
    }
  }

  async deleteTax(request: Request, response: Response): Promise<void> {
    const { id } = request.query;
    if (!id) return customError("tax id required", 404, response);

    try {
      const result = rowAffected(await promisifyQuery(deleteTaxQuery, [id]));
      response.send({
        message: result ? "delete successful" : "delete failed",
        status: result ? "success" : "failed",
      });
    } catch (err) {
      logger.error(err);
      customError("error occurred", 500, response);
    }
  }
}

