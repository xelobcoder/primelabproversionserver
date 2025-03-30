import { Request, Response } from "express";
import { customError, responseError } from "../../../helper";
import ResultPrint from "../../models/result/resultPrint";
import EmailService from "../../EmailServices/EmailCore";
import { getBillingInvoiceData } from "../../models/invoice/invoice";
import Payment from "../../models/payments/payments";
import logger from "../../../logger";

const payment = new Payment(null);

export const getResultReady = async (req: Request, res: Response) => {
  try {
    const result = await new ResultPrint(null).get_printables(req.query);
    res.send(result);
  } catch (err) {
    responseError(res);
  }
};

export const getAdvancedTablesSearch = async (req: Request, res: Response) => {
  try {
    const result = await new ResultPrint(null).advancedTablesSearch(req.query);
    res.send({ status: "success", statusCode: 200, result });
  } catch (err) {
    responseError(res);
  }
};

export const getResultById = async (req: Request, res: Response) => {
  try {
    const billingid = parseInt(req.params.id.slice(1));
    if (!billingid) return customError("billingid not provided", 404, res);
    const result = await new ResultPrint(null).get_extrainfo_test(billingid);
    res.send(result);
  } catch (err) {
    responseError(res);
  }
};

export const updatePrintCount = async (req: Request, res: Response) => {
  try {
    const { id, count } = req.body;
    if (!id || !count) return customError("test ascension id and count of print required", 404, res);
    const result = await new ResultPrint(null).updatePrintCount(id, count);
    res.send({ status: result === true ? "success" : "failed" });
  } catch (err) {
    responseError(res);
  }
};

export const getSummaryReadyPage = async (req: Request, res: Response) => {
  try {
    const result = await new ResultPrint(null).get_summary_ready_page(req.query);
    res.send(result);
  } catch (err) {
    responseError(res);
  }
};

export const getClientTransactionInfo = async (req: Request, res: Response) => {
  try {
    const result = await payment.getClientTransactionInformation(req.query, res);
    res.send({ result, statusCode: 200, status: "success" });
  } catch (err) {
    customError(err?.message, 500, res);
  }
};

export const getClientBulkOutstanding = async (req: Request, res: Response) => {
  const { patientid } = req.query;
  if (!patientid) {
    customError("patientid required", 404, res);
  } else {
    const result = await payment.allClientDebtTransactions(patientid);
    res.send({ result, statusCode: 200, status: "success" });
  }
};

export const clearClientOutstandingDebt = async (req: Request, res: Response) => {
  try {
    const { patientid, paymentmode, amountpaid, employeeid } = req.body;
    if (!patientid || !paymentmode || !amountpaid || !employeeid) {
      return customError("include amountpaid, paymentmode, employeeid and patientid in request body", 404, res);
    }
    const result = await payment.clearClientDebtBulk(patientid, amountpaid, paymentmode, employeeid);
    if (result === true) {
      res.send({ message: "updated successfully", status: "success", statusCode: "200" });
    } else if (result === "No Exist") {
      res.send({ message: "No debt available to clear", status: "error", statusCode: "500" });
    } else {
      res.send({ message: "updated failed", status: "failed", statusCode: "500" });
    }
  } catch (err) {
    responseError(res);
  }
};

export const getPaymentModes = (req: Request, res: Response) => {
  payment.paymentMode(req, res);
};

export const getClientTransactionHistory = (req: Request, res: Response) => {
  payment.specificBillTransactionHx(req, res);
};

export const updatePayment = (req: Request, res: Response) => {
  payment.updatePayment(req, res);
};

export const previewReport = async (req: Request, res: Response) => {
  try {
    const result = await new ResultPrint(null).previewReport(req, res);
    res.send({ result });
  } catch (err) {
    responseError(res);
  }
};

export const getPreviewComments = (req: Request, res: Response) => {
  const { billingid, testid } = req.query;
  if (billingid) {
    const billid: number = parseInt(billingid as string);
    new ResultPrint(billid).getComments(billingid as any, parseInt(testid as string), res as any);
  } else {
    res.send({ status: "error", statusCode: 401, message: "Include Billingid" });
  }
};

export const getResultEntryScientist = async (req: Request, res: Response) => {
  try {
    const { testid, billingid } = req.query;
    if (!billingid || !testid) {
      return customError("billingid or testid not included in the query", 404, res);
    }
    const result = await new ResultPrint(null).getResultEntryScientist(billingid, testid);
    res.send(result);
  } catch (err) {
    responseError(res);
  }
};

export const checkApproval = async (req: Request, res: Response) => {
  const { billingid, testid } = req.body;
  if (billingid && testid) {
    const approved = await new ResultPrint(null).checkApproval(billingid, testid);
    res.send({ approved });
  } else {
    res.status(401).json({ status: "error", message: "include testid and billing in request body" });
  }
};

export const makeDecisionOnResult = async (req: Request, res: Response) => {
  try {
    const result = await new ResultPrint(null).makeDecisionOnResult(req.body);
    result
      ? res.send({ status: "success", statusCode: 200, message: "update successful" })
      : res.send({ status: "error", statusCode: 401, message: "error updating data" });
  } catch (err) {
    responseError(res);
  }
};

export const getBillingInvoice = (req: Request, res: Response) => {
  const { billingid } = req.query;
  getBillingInvoiceData(billingid as any, res);
};

// export const emailBillingReceipt = async (req: Request, res: Response) => {
//   const { billingid } = req.query;
//   if (billingid) {
//     await new EmailService().forwardBillingReceipt(billingid);
//   } else {
//     customError("billing id required", 404, res);
//   }
// };

export const getTransactionApprovedTest = async (req: Request, res: Response) => {
  try {
    const { billingid } = req.query;
    const result = await new ResultPrint(billingid).getTransactionApprovedTest(billingid);
    res.send(result);
  } catch (err) {
    responseError(res);
  }
};

export const getBillingReceipt = async (req: Request, res: Response) => {
  const { billingid } = req.query;
  if (!billingid) {
    customError("billingid not provided", 404, res);
  }
};
