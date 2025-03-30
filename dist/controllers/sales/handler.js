"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDailySummary = exports.handleGeneralSalesSummary = void 0;
const billing_1 = require("../billing");
const Expense_1 = __importDefault(require("../models/Expenses/Expense"));
const registration_1 = __importDefault(require("../models/registration"));
const sales_1 = __importDefault(require("../models/sales"));
// Sales Handlers
const handleGeneralSalesSummary = (req, res) => {
    const { target, branch, clinicianid, patientid } = req.query;
    if (!target || !["yearly", "monthly", "daily", "weekly"].includes(target) || !branch) {
        res.status(400).send({
            status: "error",
            message: "Please provide a target and include branch in request query",
        });
    }
    else {
        sales_1.default.generalSales(target, branch, clinicianid, patientid, res);
    }
};
exports.handleGeneralSalesSummary = handleGeneralSalesSummary;
// Summary Handlers
const handleDailySummary = async (req, res) => {
    try {
        const { branchid, employeeid } = req.query;
        const current_registration = await new registration_1.default().getTodayRegistedClientCount();
        const currentBilledClients = await new billing_1.Billing().getDayBilledClientsCount(branchid);
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const day = new Date().getDate();
        const current_date = `${year}-${month}-${day}`;
        const currentExpense = await new Expense_1.default(employeeid, branchid).calculateDailyExpense(current_date);
        const dailySales = await sales_1.default.getDailySalesSummary(branchid, current_date);
        res.send(Object.assign({ registeredClient: current_registration, billedClients: currentBilledClients, dayExpenseSum: currentExpense }, dailySales));
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: "Internal server error" });
    }
};
exports.handleDailySummary = handleDailySummary;
