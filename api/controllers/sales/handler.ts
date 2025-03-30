import { Request, Response } from "express";
import { Billing } from "../billing";
import Expenses from "../models/Expenses/Expense";
import Registration from "../models/registration";
import sales from "../models/sales";

// Sales Handlers
export const handleGeneralSalesSummary = (req: Request, res: Response) => {
  const { target, branch, clinicianid, patientid } = req.query;

  if (!target || !["yearly", "monthly", "daily", "weekly"].includes(target) || !branch) {
    res.status(400).send({
      status: "error",
      message: "Please provide a target and include branch in request query",
    });
  } else {
    sales.generalSales(target, branch, clinicianid, patientid, res);
  }
};

// Summary Handlers
export const handleDailySummary = async (req: Request, res: Response) => {
  try {
    const { branchid, employeeid } = req.query;
    const current_registration = await new Registration().getTodayRegistedClientCount();
    const currentBilledClients = await new Billing().getDayBilledClientsCount(branchid);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const day = new Date().getDate();
    const current_date = `${year}-${month}-${day}`;
    const currentExpense = await new Expenses(employeeid, branchid).calculateDailyExpense(current_date);
    const dailySales = await sales.getDailySalesSummary(branchid, current_date);

    res.send({
      registeredClient: current_registration,
      billedClients: currentBilledClients,
      dayExpenseSum: currentExpense,
      ...dailySales,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
};
