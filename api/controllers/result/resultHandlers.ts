import { IRequest, IResponse } from "./types";
import logger from "../../../logger";
import { customError,responseError } from "../../../helper";
// import Patient from "../models/patientAnalytics";
import Creator from "../../models/creator/creator";

// export const getPatientTestTrend = async (req: IRequest, res: IResponse): Promise<void> => {
//   const { patientid, testid, test, instances } = req.query;
//   try {
//     const result = await new Patient(patientid).getPatientTestTrend(patientid, testid, test, instances);
//     res.send({ statusCode: 200, status: "success", result });
//   } catch (err) {
//     logger.error(err);
//     customError("Error occurred", 500, res);
//   }
// };

export const resultEntry = async (req: IRequest, res: IResponse): Promise<void> => {
  try {
    const { testid } = req.body;
    if (isNaN(testid)) return customError("testid must be a number", 400, res);
    const isDataInserted = await new Creator(testid).resultEntry(req, res);
    res.send(isDataInserted);
  } catch (err) {
    console.log(err)
    responseError(res);
  }
};
