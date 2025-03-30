import { Request, response, Response } from "express";
import { customError, rowAffected,responseError } from "../../../helper";
import Operations from "../../models/operations/operations";


export const getAllCollections = async (req: Request, res: Response) => {
  try {
    const { departmentid } = req.query;
    if (!departmentid) {return customError("departmentid not included in request query", 400, res)}
    const collections = new Operations(null);
    const result = await collections.getLaboratoryTestReadyForResultEntry(departmentid as any);
    res.send({ statusCode: 200, message: "success", result });
  } catch (err) {
    responseError(res);
  }
};

export const getBillingTest = async (req: Request, res: Response) => {
  const { billingid } = req.query;

  if (!billingid) {
    res.status(400).send({
      statusCode: 400,
      message: "Invalid billingid",
    });
    return;
  }

  const result = await new Operations(billingid as string).billingTest(req);

  if (result === "Billingid is not ready for testing") {
    res.status(400).send({
      statusCode: 400,
      message: result,
    });
  } else {
    res.send({
      statusCode: 200,
      message: "success",
      result,
    });
  }
  
};

export const initiateProcessing = async (req: Request, res: Response) => {
  try {
    const { billingid, testid } = req.query;
    if (!billingid || !testid) {return customError("billing id or testid is missing", 404, res);}
    const operations = new Operations(billingid as any);
    const result = await operations.initiateTestProcessing(testid as any, billingid as any);
    res.send({ status: result ? "success" : "failed" });
  } catch (err) {
    responseError(res);
  }
};

export const getAllEnterResult = async (req: Request, response: Response) => {
  try {
    const result = await new Operations(null).getAllEnterResult(req.query as any);
    response.send({ result, statusCode: 200 });
  } catch (err) {
    responseError(response);
  }
};

export const getAllTestPreview = async (req: Request, res: Response) => {
  try {
    let billingid = req.query.billingid as any;
    if (!billingid) return customError("billingid required", 400, res);
    const result = await new Operations(billingid).getAllTestPreview(billingid);
    res.send({
      statusCode: 200,
      result,
      status: "success",
    });
  } catch (err) {
    responseError(res);
  }
};

export const getAllPendingCases = async (req: Request, res: Response) => {
  try {
    const { count = 10, page = 1, departmentid, status, testid, billingid, fullname, from, to } = req.query;
    const data = { count, page, departmentid, status, testid, fullname, from, to, billingid };
    const result = await new Operations(null).getAllCasesResultEntryByMany(data as any);
    res.send({ result, statusCode: 200, status: "success" });
  } catch (err) {
    responseError(res);
  }
};

export const getUltrasoundWaitingList = async (request: Request, response: Response) => {
  try {
    const { page, count } = request.query;
    const waitingList: [] = await new Operations(null).getUltrasoundWaitingList({ page, count } as any);
    response.send(waitingList);
  } catch (err) {
    responseError(response);
  }
};

export const getProcessedScanList = async (req: Request, res: Response) => {
  try {
    const result = await new Operations(null).processedScanList(req.query as any);
    response.send(result);
  } catch (err) {
    responseError(res);
  }
};
