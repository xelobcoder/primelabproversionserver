import { Request, Response } from "express";
import { customError, rowAffected, responseError } from "../../../helper";
import ApplicationSettings from "./../../models/application/appsettings/appset";
import Tax from "../../models/application/Tax";
import ResultSettings from "../../models/application/appsettings/resultSettings";
import logger from "../../../logger";

const appsettings = new ApplicationSettings();
const tax = new Tax(null);
const result = new ResultSettings(null);

export const getApplicationSettings = async (req: Request, response: Response) => {
  try {
    const result = await appsettings.getAllAppSettings();
    response.send({ statusCode: 200, status: "success", result });
  } catch (err) {
    responseError(response);
  }
};

export const getApplicationSettingsBilling = async (req: Request, res: Response) => {
  try {
    const data = await appsettings.getAppBillSettings();
    res.send(data);
  } catch (err) {
    responseError(res);
  }
};

export const updateApplicationSettings = async (request: Request, response: Response) => {
  try {
    const data = request.body;
    const is_updated = await appsettings.updateApplicationSettings(data);
     is_updated && response.send({ message: "Applications settings updated successfully", statusCode: 200, status: "success" });
  } catch (err) {
    console.log(err);
    responseError(response);
  }
};

export const updateSmsSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const is_updated = await appsettings.updateSmsSettings(data);
    res.send({ status: is_updated });
  } catch (err) {
    responseError(res);
  }
};

export const getSmsSettings = async (request: Request, response: Response) => {
  try {
    const sms_settings = await appsettings.getSmsSettings();
    response.send(sms_settings);
  } catch (err) {
    responseError(response);
  }
};

export const getEmailPreference = async (req: Request, res: Response) => {
  try {
    const result = await appsettings.getEmailPreference();
    res.send({ message: "success", status: "success", statusCode: 200, result });
  } catch (err) {
    customError("something went wrong", 500, res);
  }
};

export const getGeneralEmailSettings = async (req: Request, response: Response) => {
  try {
    const result = await appsettings.getGeneralEmailSettings();
    response.send({ message: "success", status: "success", statusCode: 200, result });
  } catch (err) {
    customError("something went wrong", 500, response);
  }
};

export const updateGeneralEmailSettings = async (request: Request, res: Response) => {
  try {
    const result = await appsettings.updateGeneralEmailSettings(request.body);
    res.send({
      message: rowAffected(result) ? "updated successfully" : "No updates effected",
      status: "success",
      statusCode: 200,
    });
  } catch (err) {
    customError("something went wrong", 500, res);
  }
};

export const updateEmailPreference = (request: Request, response: Response) => {
  try {
    const data = request.body;
    const updated = appsettings.updateEmailPreference(data);
    response.send(updated);
  } catch (err) {
    responseError(response);
  }
};

export const updateRegistrationFields = async (request: Request, response: Response) => {
  try {
    const result = await appsettings.updateRegistrationFields(request.body);
    if (result === true) {
      response.send({ message: "fields updated successfully", statusCode: 200, status: "success" });
    } else {
      response.send({ message: "fields update failed", statusCode: "error", status: "error" });
    }
  } catch (err) {
    logger.error(err);
    responseError(response);
  }
};

export const getRegistrationSettings = async (req: Request, res: Response) => {
  try {
    let result = await appsettings.getRegistrationSettings();
    if (result.length > 0) {
      result = result[0]["fields"];
      if (result !== "{}") {
        return res.send(result);
      }
      res.send(result);
    } else {
      return res.send({});
    }
  } catch (err) {
    responseError(res);
  }
};

export const addTax = (req: Request, res: Response) => {
  tax.addTax(req, res);
};

export const getTax = (req: Request, res: Response) => {
  tax.getTax(req, res);
};

export const updateTax = (req: Request, res: Response) => {
  tax.updateTax(req, res);
};

export const changeTaxStatus = (req: Request, res: Response) => {
  tax.changeTaxStatus(req, res);
};

export const deleteTax = (req: Request, res: Response) => {
  tax.deleteTax(req, res);
};

export const getResultSettings = (req: Request, res: Response) => {
  result.getResultSettings(req, res);
};

export const updateResultSettings = (req: Request, res: Response) => {
  result.updateResultSettings(req, res);
};
