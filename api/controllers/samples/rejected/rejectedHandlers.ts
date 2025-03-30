import { Request, Response } from "express";
import { responseError } from "../../../../helper";
import logger from "../../../../logger";
import SampleHandler from "../sample";

const handleSample = new SampleHandler();

export const getRejectedSamplesList = (req: Request, res: Response) => {
  handleSample.getRejectedSamplesList(req, res);
};

export const rejectedSampleApproval = (req: Request, res: Response) => {
  handleSample.rejectedSampleApproval(req, res);
};

export const disputeSampleRejection = (req: Request, res: Response) => {
  handleSample.disputeSampleRejection(req, res);
};

export const getSampleDisputeLog = async (req: Request, res: Response) => {
  try {
    await handleSample.getSampleDisputeLog(req, res);
  } catch (err) {
    logger.error(err);
    responseError(res);
  }
};
