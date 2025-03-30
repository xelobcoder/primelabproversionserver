import { customError } from "../../../helper";
import { Billing } from "../../models/billing/billing";
import { Request, Response } from "express";
import { billErrors } from "../../models/billing/billingclientTypes";
import { wrapperTryCatch } from "../../models/generics/trycatch";

export async function handleNewBilling(request: Request, response: Response) {
  async function validate() {
    const { patientid } = request.body;
    let bill = await new Billing(patientid).insertionProcess(request.body, true);
    if (typeof bill == "string" && bill == billErrors.already) {
      return response.send({ message: bill, statusCode: 200, status: "success" });
    } else if (typeof bill == "boolean" && bill) {
      return response.status(200).json({
        message: "billing successfully",
        statusCode: 200,
        status: "success",
      });
    } else {
      return customError(billErrors.error, 400, response);
    }
  }
  wrapperTryCatch(validate,(err) => console.log(err));
}




export async function canInitiateBill(request: Request, response: Response) {
  let { patientid } = request.query;
  if (!patientid) {
    return customError(`Bad Request. patientid required`, 404, response);
  }
  let ptid: number;
  if (typeof patientid === "string") {
    ptid = parseInt(patientid);
  }

  if (isNaN(ptid)) {
    customError("Bad Request.patientid must a number", 400, response);
  }
  const canBill = await new Billing(ptid).haveBeenBilledToday(ptid);
  response.send({ canInitiateBill: canBill });
}



export async function getBilledClients(request: Request, response: Response) {
  
}

// app.get("/api/v1/billedclients", (req, res) => {
//   getBilledClients(req, res)
// })