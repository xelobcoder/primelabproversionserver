import { Response } from "express";
import { testInformation, clientInformation } from "./handlers";
import { customError, convertKeysToLowerCase } from "../../../helper";

async function getBillingInvoiceData(billingid: string | number, response?: Response): Promise<any> {
  if (billingid) {
    const Invoice: { testInformation?: any[]; clientInformation?: any } = {};

    try {
      Invoice.testInformation = await testInformation(billingid);
      Invoice.clientInformation = await clientInformation(billingid);
      const resultset = {
        testInformation: Invoice.testInformation.length > 0 ? Invoice.testInformation.map((item) => convertKeysToLowerCase(item)) : [],
        clientInformation: Invoice.clientInformation.length > 0 ? convertKeysToLowerCase(Invoice.clientInformation[0]) : {},
      };
      if (response) {
        response.send({
          result: resultset,
          message: "success",
          statusCode: 200,
        });
      } else {
        return resultset;
      }
    } catch (err) {
      if (response) {
        customError(err.message || err, 500, response);
      } else {
        throw err;
      }
    }
  } else {
    if (response) {
      customError("billingid required in query", 401, response);
    } else {
      throw new Error("billingid required in query");
    }
  }
}

export { getBillingInvoiceData };
