import { Request, Response } from "express";
import { promisifyQuery } from "../../../helper";
import logger from "../../../logger";
import { testInformationQuery, clientInformationQuery } from "./queries";

export const testInformation = async (billingid: string | number): Promise<any[]> => {
  try {
    return await promisifyQuery(testInformationQuery, [billingid]);
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
};

export const clientInformation = async (billingid: string | number): Promise<any[]> => {
  try {
    return await promisifyQuery(clientInformationQuery, [billingid]);
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
};
