import { request, Request, Response } from "express";
import Supply from "../../models/supply/supplierClass";
import { customError, responseError } from "../../../helper";
import { logger } from "../../../logger";
import Inventory from "../../models/Inventory/inventoryClass/inventoryClass";

export const getSuppliers = async (request: Request, response: Response): Promise<void> => {
  try {
    const { supplierid } = request.query as { supplierid?: string };
    let result = [];
    if (supplierid) {
      result = await new Supply().getSupplier(parseInt(supplierid));
    } else {
      result = await new Supply().getSuppliers(request.query);
    }
    response.send({ result, statusCode: 200, status: "success" });
  } catch (err) {
    customError("something went wrong", 500, response);
    logger.err(err);
  }
};

export const getSupplierStatusUnfulfilled = async (request: Request, response: Response): Promise<void> => {
  const { supplierid, status } = request.query as { supplierid?: string; status?: string };
  if (!supplierid) {
    return customError("supplierid not provided", 404, response);
  }
  const result = await new Supply().getSupplierPendingOrders(parseInt(supplierid), status);
  response.send(result);
};

export const getSupplierById = async (request: Request, response: Response): Promise<void> => {
  try {
    const { supplierid } = request.query as { supplierid?: string };
    if (!supplierid) return customError(`supplier id not included in request`, 404, response);
    const result = await new Supply().getSupplier(parseInt(supplierid));
    response.send({ result, statusCode: 200, status: "success" });
  } catch (err) {
    responseError(response);
  }
};

export const addSupplier = async (request: Request, response: Response): Promise<void> => {
  try {
    const result = await new Supply().addSupplier(request.body);
    response.send(result);
  } catch (err) {
    customError("something went wrong", 500, response);
  }
};

export const deleteSupplier = async (request: Request, response: Response): Promise<void> => {
  try {
    const { supplierid } = request.query as { supplierid?: string };
    if (!supplierid) {
      return customError("supplierid must be provided", 404, response);
    }
    const isdeleted = await new Supply().deleteSupplier(parseInt(supplierid));
    response.send({ statusCode: 200, status: "success", message: isdeleted ? "deleted successfully" : "deleting supplier failed" });
  } catch (err) {
    customError("something went wrong", 500, response);
  }
};

export const updateSupplier = async (request: Request, response: Response): Promise<void> => {
  try {
    const isUpdated = await new Supply().updateSupplier(request.body);
    if (isUpdated === false) {
      customError("supplier id not provided", 404, response);
      return;
    }
    response.send({
      message: isUpdated != null ? "Supplier information updated successfully" : "Failure in updating supplier",
      statusCode: 200,
      status: isUpdated != null ? "success" : "error",
    });
  } catch (err) {
    customError("something wrong occured", 500, response);
  }
};

export const addCommodity = async (request: Request, response: Response): Promise<void> => {
  try {
    const added = await new Supply().postCommodity(request.body);
    response.send({
      message: added != null ? "new commodity added successfully " : "Failure in adding category",
      statusCode: 200,
      status: added != null ? "success" : "error",
    });
  } catch (err) {
    customError(err || "something went wrong", err === "name and category required" ? 404 : 500, response);
  }
};

export async function handleReceiveOrders(request: Request, response: Response) {
  try {
    const { data, tax, totalprice,employeeid } = request.body;
    const result = await new Inventory(null).receivePurchaseStocks(data, totalprice, tax,employeeid);
    return result
      ? response.send({ message: "order updated successfully", statusCode: 200, status: "success" })
      : response.send({ message: "order update failed", statusCode: 200, status: "success" });
  } catch (err) {
    customError("something wrong occured", 500, response);
  }
}



