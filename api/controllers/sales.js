const { Billing } = require('../billing');
const Expenses = require('../models/Expenses/Expense');
const Registration = require('../models/registration');
const sales = require('../models/billing/sales/sales');
const router = require('express').Router();


router.get('/api/v1/sales/summary/general', function (request, response) {
  const { target, branch, clinicianid,patientid } = request.query
  if (!target || !["yearly", "monthly", "daily", "weekly"].includes(target)  || !branch) {
    response.send({
      statusCode: 400,
      status: "error",
      message: "Please provide a target and include branch in request query",
    })
  } else {
    sales.generalSales(target, branch, clinicianid,patientid,response,)
  }
})


router.get('/api/v1/summary/daily', async function (request, response) {
  try {
    const { branchid, employeeid } = request.query;
    const current_registration = await new Registration().getTodayRegistedClientCount();
    const currentBilledClients = await new Billing().getDayBilledClientsCount(branchid);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const day = new Date().getDate();
    const current_date = `${year}-${month}-${day}`;
    const currentExpense = await new Expenses(employeeid, branchid).calculateDailyExpense(current_date);
    const dailySales = await sales.getDailySalesSummary(branchid, current_date);
    response.send({ registeredClient: current_registration, billedClients: currentBilledClients, dayExpenseSum: currentExpense,...dailySales});
  } catch (err) {
    console.log(err)
  }
})







module.exports = router;