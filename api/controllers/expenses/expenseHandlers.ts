// src/expenseHandlers.ts

import { Request, Response } from "express";
import { customError, responseError } from "../../../helper";
import Expenses from "../../models/Expenses/Expense";
import path from "node:path";

const expenses = new Expenses();

export const generateNewExpense = async (req: Request, res: Response) => {
  expenses.generateNewExpense(req.body, res);
};

export const getExpensesRecord = async (req: Request, res: Response) => {
  const { employeeid, branchid, count, page, status, from, to } = req.query;
  if (!employeeid) {
    return customError("employeeid required", 404, res);
  }
  const records = await expenses.getExpensesRecord(employeeid, branchid, status, { page, count }, from, to);
  res.send(records);
};

export const getSingleExpense = async (req: Request, res: Response) => {
  try {
    const { expenseid } = req.query;
    if (!expenseid) {
      return customError("expenseid not provided", 404, res);
    }
    const record = await expenses.getSingleExpense(expenseid);
    res.send(record);
  } catch (err) {
    if (err?.message) {
      res.send({ status: "error", err });
    } else {
      return responseError(res);
    }
  }
};

export const uploadReceipts = async (req: Request, res: Response) => {
  try {
    res.send({ status: "success" });
  } catch (err) {
    console.log(err);
  }
};

export const getReceiptImage = async (req: Request, res: Response) => {
  try {
    const { imageid } = req.query;
    if (!imageid) {
      return customError("image not provided", 404, res);
    }
    res.sendFile(path.join(__dirname, `../uploads/receipts/${imageid}`));
  } catch (err) {
    responseError(res);
  }
};

export const getExpenseImageList = async (req: Request, res: Response) => {
  const { expenseid } = req.query;
  if (!expenseid) {
    return customError("expenseid not provided", 404, res);
  }
  const result = await expenses.getExpenseImageList(expenseid);
  res.send(result);
};

export const deleteReceiptsList = async (req: Request, res: Response) => {
  const { data } = req.body;
  if (data && Array.isArray(data) && data.length > 0) {
    const status = await expenses.deleteReceiptsList(data);
    res.send({ status: status ? "success" : "failed" });
  } else {
    return customError("image List not provided", 404, res);
  }
};

export const updateExpenseDecision = async (req: Request, res: Response) => {
  try {
    const { expenseid, employeeid, status, information } = req.body;
    const result = await expenses.updateExpenseDecision(status, expenseid, information, employeeid);
    res.send({ status: result === true ? "success" : "failed" });
  } catch (err) {
    responseError(res);
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { category, employeeid } = req.body;
    if (!employeeid || !category) {
      return customError("employeeid and expense category required", 404, res);
    }
    const expenseCreation = await expenses.createExpenseCategory(category, employeeid);
    if (typeof expenseCreation === "boolean") {
      return expenseCreation === true
        ? res.send({ message: "category created successfully", statusCode: 200, status: "success" })
        : res.send({ message: "category creation failed", statusCode: 200, status: "failed" });
    }

    if (typeof expenseCreation === "string" && expenseCreation.trim() === "category exist") {
      res.send({ message: "category already exist", statusCode: 200, status: "success" });
    }
  } catch (err) {
    console.log(err);
    responseError(res);
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { category, employeeid, editid } = req.body;
    if (!employeeid || !category || !editid) {
      return customError("employeeid, expense category and category id required", 404, res);
    }
    const updateExpenseCategory = await expenses.updateExpenseCategory(editid, category);
    res.send({ status: updateExpenseCategory });
  } catch (err) {
    responseError(res);
  }
};

export const getAllExpenseCategory = async (req: Request, res: Response) => {
  try {
    const expensecategories = await expenses.getAllExpenseCategory();
    res.send(expensecategories);
  } catch (err) {
    responseError(res);
  }
};
