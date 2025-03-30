"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultEntry = void 0;
const helper_1 = require("../../../helper");
// import Patient from "../models/patientAnalytics";
const creator_1 = __importDefault(require("../../models/creator/creator"));
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
const resultEntry = async (req, res) => {
    try {
        const { testid } = req.body;
        if (isNaN(testid))
            return (0, helper_1.customError)("testid must be a number", 400, res);
        const isDataInserted = await new creator_1.default(testid).resultEntry(req, res);
        res.send(isDataInserted);
    }
    catch (err) {
        console.log(err);
        (0, helper_1.responseError)(res);
    }
};
exports.resultEntry = resultEntry;
