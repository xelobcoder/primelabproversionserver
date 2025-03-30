import { Request, Response } from "express";
import {
  getClinicians,
  putCliniciansbasic,
  deleteClinicians,
  getSingleClinician,
  postClinicianBasicInfo,
  getTopPerformingClinicians,
  getClinicianResult,
  getBillingTestBasedByClinician,
} from "../../api/clinicians";
import { customError } from "../../helper";
import logger from "../../logger";
import EmailService from "../EmailServices/EmailCore";
import { Billing } from "../../api/billing";
import Registration from "../models/registration";

export async function getCliniciansHandler(req: Request, res: Response): Promise<void> {
  getClinicians(req, res);
}

export async function getSingleClinicianHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.query as { id?: string };
  if (!id) {
    customError("clinicianid required", 404, res);
  } else {
    getSingleClinician(req, res);
  }
}

export async function putCliniciansHandler(req: Request, res: Response): Promise<void> {
  putCliniciansbasic(req, res);
}

export async function deleteCliniciansHandler(req: Request, res: Response): Promise<void> {
  deleteClinicians(req, res);
}

export async function postCliniciansHandler(req: Request, res: Response): Promise<void> {
  try {
    const outcome = await postClinicianBasicInfo(req, res);
    if (typeof outcome !== "number" || typeof outcome === "string") {
      customError(outcome, 404, res);
      return;
    }
    res.send({ message: "clinician added successfully", statusCode: 200, status: "success" });
    await new EmailService().fireClientAuthentication(req.body?.email as string, "clinician", outcome);
  } catch (err) {
    customError("Something wrong ocured", 500, res);
  }
}

export async function getTopPerformingCliniciansHandler(req: Request, res: Response): Promise<void> {
  getTopPerformingClinicians(req, res);
}

export async function filterClinicianHandler(req: Request, res: Response): Promise<void> {
  const { data } = req.body as { data?: any };
  if (!data) {
    customError("please add data", 401, res);
    return;
  }
  try {
    const result = await new Registration().filterPatientUsingClient(data);
    res.send({ status: "success", statusCode: 200, result });
  } catch (err) {
    customError("Something wrong ocured", 500, res);
  }
}

export async function getClinicianResultHandler(req: Request, res: Response): Promise<void> {
  try {
    const { clinicianid, startdate, enddate } = req.query as { clinicianid?: string; startdate?: string; enddate?: string };
    if (!clinicianid) {
      customError("please add clinicianid", 401, res);
      return;
    }
    const result = await getClinicianResult(clinicianid, startdate, enddate);
    res.send({ status: "success", statusCode: 200, result });
  } catch (err) {
    logger.error(err);
    customError(err, 401, res);
  }
}

export async function getBillingTestBasedByClinicianHandler(req: Request, res: Response): Promise<void> {
  try {
    const { billingid, clinicianid } = req.query as { billingid?: string; clinicianid?: string };
    if (!billingid || !clinicianid) {
      customError("please add billingid and clinicianid", 401, res);
      return;
    }
    const result = await getBillingTestBasedByClinician(billingid, clinicianid);
    res.send({ statusCode: 200, status: "success", result });
  } catch (err) {
    logger.error(err);
    customError(err?.message || "something went wrong", 500, res);
  }
}

export async function postTemporaryOrderHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await new Registration().temporaryOrder(req.body);
    if (result === true) {
      res.send({ statusCode: 200, status: "success", message: "order added successfully" });
    } else {
      const message = result === false ? "kindly update orders in the order page" : "something went wrong while trying to add order";
      customError(message, 500, res);
    }
  } catch (err) {
    customError("Something wrong ocured", 500, res);
  }
}

export async function getTemporaryOrdersHandler(req: Request, res: Response): Promise<void> {
  const { clinicianid, target, date } = req.query as { clinicianid?: string; target?: string; date?: string };
  if (!target) {
    customError("please addd target for query ", 401, res);
    return;
  }
  try {
    const result = await new Registration().getTemporaryOrders(target, clinicianid, date);
    res.send({ statusCode: 200, status: "success", result });
  } catch (err) {
    customError("Something wrong ocured", 500, res);
  }
}

export async function getTemporaryOrdersProcessingHandler(req: Request, res: Response): Promise<void> {
  const { orderid } = req.query as { orderid?: string };
  if (!orderid) {
    customError("please add id", 401, res);
    return;
  }
  try {
    const result = await new Registration().getTemporaryOrdersProcessing(orderid);
    res.send({ statusCode: 200, status: "success", result });
  } catch (err) {
    customError("Something wrong ocured", 500, res);
  }
}

export async function postProcessedOrderHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      patientid,
      clinician,
      organization,
      orderid,
      test,
      payable,
      testcost,
      paid,
      taxIncluded,
      taxValue,
      status,
      discount,
      paymentmode,
      samplingCenter,
      outstanding,
      cost,
      employeeid,
    } = req.body;

    if (!employeeid || !clinician) {
      customError("Bill can initiation failed, include employeeid and clincianid", 404, res);
      return;
    }

    const billing = new Billing(
      patientid,
      clinician,
      organization,
      test,
      payable,
      testcost,
      paid,
      taxIncluded,
      taxValue,
      status,
      discount,
      paymentmode,
      samplingCenter,
      outstanding,
      cost
    );

    const outcome = await billing.insertionProcess(req, res, employeeid, false);

    if (typeof outcome === "string") {
      customError(outcome, 404, res);
      return;
    }

    if (typeof outcome === "boolean") {
      if (outcome !== true) {
        customError("error in processsing order", 404, res);
        return;
      }

      const isUpdated = await new Registration().updateProcessedOrder(orderid);
      if (!isUpdated) {
        customError("error processing order", 500, res);
        return;
      }

      res.send({ message: "order processed successfully", statusCode: 200, status: "success" });
    }
  } catch (err) {
    console.log(err);
    customError(err?.message || err, 500, res);
  }
}
