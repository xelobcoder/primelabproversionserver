// src/emailHandlers.ts

import { Request, Response } from "express";
import { customError } from "../../../helper";
import EmailService from "../EmailServices/EmailCore";
import path from "node:path";

const emailService = new EmailService();

export const emailSummary = async (req: Request, res: Response) => {
  await emailService.emailSummary(res);
};

export const getEmailSummaryByDay = async (req: Request, res: Response) => {
  await emailService.getEmailSummaryByDay(res);
};

export const getEmailLog = async (req: Request, res: Response) => {
  await emailService.getEmailLog(1, 20, res);
};

export const customSearch = async (req: Request, res: Response) => {
  const { email, category } = req.query;
  if (!email || !category) {
    customError(res, 400, "Email and Category are required");
    return;
  }
  const result = await emailService.customSearch(req.query, res);
  Array.isArray(result) ? res.send({ statusCode: 200, result }) : res.send({ statusCode: 400, message: result });
};

export const saveComposedEmailDraft = async (req: Request, res: Response) => {
  const { subject, draft, employeeid } = req.body;
  if (!subject || !draft || !employeeid) {
    customError(res, 404, "Subject, Draft, and employeeid are required");
    return;
  }
  const result = await emailService.saveComposedEmailDraft(subject, draft, employeeid);
  res.send({
    message: result === 1 ? "Draft saved successfully" : "Error saving draft",
    statusCode: result === 1 ? 200 : 400,
    status: result === 1 ? "success" : "error",
  });
};

export const getComposedEmailDraft = async (req: Request, res: Response) => {
  const { mode, id, target, limit } = req.query;
  try {
    const result = await emailService.getComposedEmailDraft(target, limit, mode, id);
    res.send({ statusCode: 200, result, status: "success" });
  } catch (error) {
    customError(res, 400, error?.message || "Error getting draft");
  }
};

export const updateEmailComposed = async (req: Request, res: Response) => {
  const { id, subject, draft, employeeid } = req.body;
  if (!id || !subject || !draft || !employeeid) {
    customError(res, 404, "Id, Subject, Draft, and employeeid are required");
    return;
  }
  const result = await emailService.updateEmailComposed(id, subject, draft, employeeid);
  res.send({
    message: result === 1 ? "Draft updated successfully" : "Error updating draft",
    statusCode: result === 1 ? 200 : 400,
    status: result === 1 ? "success" : "error",
  });
};

export const publishEmail = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    customError(res, 404, "Id is required");
    return;
  }
  const result = await emailService.publishEmail(req.body);
  res.send({ statusCode: 200, message: result, status: "success" });
};

export const renderVerifyEmailPage = (req: Request, res: Response) => {
  res.render(path.join(__dirname, "../views/pages/verifyemail.ejs"));
};

export const verifyEmailToken = async (req: Request, res: Response) => {
  const { token } = req.query;
  try {
    const isVerify = await emailService.verifyClientAuthToken(token);

    if (typeof isVerify === "string") {
      customError(res, 400, isVerify);
      return;
    }

    if (isVerify) {
      res.send({
        statusCode: 200,
        message:
          "Email verified successfully. Temporary access credentials will be sent to your mail. Kindly access it and use it to login to your portal. You are advised to quickly update credentials as soon as possible",
        status: "success",
      });
    }
  } catch (err) {
    customError(res, 400, "Link is expired");
  }
};
