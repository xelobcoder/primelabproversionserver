const express = require("express");
const app = express()
const emailRouterController = require("./api/controllers/email.controller")
const port = process.env.NODE_ENV == "development" ? process.env.DEVELOPMENT_PORT :
  process.env.PRODUCTION_PORT;
const { Billing, getClientBillingInformation, getBilledClients, updateBilling } = require("./api/billing")
const branchesHandler = require("./api/branches")
const resultChecker = require("./api/controllers/result/route")
const Manager = require("./api/controllers/manager")
const operationsRouter = require("./api/controllers/operations/route");
const registrationRouter = require("./api/controllers/registration")
const rejectedRouter = require("./api/controllers/rejected")
const stocksRouter = require("./api/controllers/Inventory/stocks")
const activation = require("./api/activation")
const clinicianRouter = require("./api/controllers/clinicians")
const { get } = require("./api/center")
const SampleHandler = require("./api/sample")
const phelobotomyRouter = require("./api/controllers/phelobotomy")
const supplyRouter = require("./api/controllers/supplys/routes")
const settingsRouter = require("./api/controllers/settings")
const User = require("./api/LobnosAuth/user")
const LoginsRouter = require("./api/controllers/logins")
const resultprintRouter = require("./api/controllers/printables/routes")
const organizationRouter = require("./api/controllers/organization/route");
const applicationsettingsRouter = require("./api/controllers/applicationsettings/route")
const generalSalesRouter = require("./api/controllers/sales")
const patientAnalytics = require("./api/controllers/patients.controller")
const WarehouseRouter = require("./api/controllers/Inventory/warehouse")
const wastagesRouter = require("./api/controllers/Inventory/wastages")
const inventoryDepartmentRouter = require("./api/controllers/Inventory/departments")
const HumanResourceModel = require("./api/models/HumanResources/HRMClass")
const BillingRouter = require("./api/controllers/billing/index");
const testPanelRouter = require("./api/controllers/testpanel/testpanelRouter");
const expenseRouter = require("./api/controllers/expenses/expense.controller");
const cors = require("cors");
const Security = require("./api/models/security/security");
const SecurityRouter = require("./api/controllers/security/security.controllers");
const Appointmentouter = require("./api/controllers/appointments/appointment");
const customerRouter = require("./api/controllers/customers/route");
const { promisifyQuery, paginationQuery } = require("./helper")

app.listen(port, async (err) => {
  const security = new Security();
  // const isLicensed = await security.environmentSecurity(__dirname);
  // if (!isLicensed) {
  //   console.log('Existing application')
  //   process.exit();
  // }
});


const Inventoryanalytics = require("./api/models/Inventory/inventoryAnalytics");
const redisMiddleware = require("./api/middleware/redis/redisMiddleware");
app.use(cors({ origin: "*", credentials: true, preflightContinue: false }))
app.use(express.static("public"))

// manage with cors
// manage with body-parser
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "https://vitalscan.primelabsys.com");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE","PATCH");
//   res.header("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(function (request, response, next) {
  if (request.session) {
    request.sessionOptions({ name: 'tiifu hamza', age: 23 });
  }
  next();
})
// ensuring an acess token is present
// app.use(async (req, res, next) => {
//   if (req.url == '/api/v1/register') {
//     next();
//   } else {
//     await new User().validateRequestToken(req, res, next, process.env.ACCESS_TOKEN_SECRET)
//   }
// })


// app.use(redisMiddleware);
app.use(BillingRouter);
app.use(testPanelRouter)
app.use(expenseRouter)
app.use(Manager)
app.use(organizationRouter)
app.use(Appointmentouter);
app.use(emailRouterController)
app.use(LoginsRouter)
app.use(phelobotomyRouter)
app.use(rejectedRouter)
app.use(supplyRouter)
app.use(settingsRouter)
app.use(operationsRouter)
app.use(resultprintRouter)
app.use(resultChecker)
app.use(clinicianRouter)
app.use(generalSalesRouter)
app.use(branchesHandler)
app.use(registrationRouter)
app.use(applicationsettingsRouter)
app.use(customerRouter);
app.use(stocksRouter)
app.use(patientAnalytics)
app.use(WarehouseRouter)
app.use(wastagesRouter)
app.use(inventoryDepartmentRouter)
app.use(SecurityRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "success" })
})

app.get("/api/v1/authenticate/employee/token", async function (request, response) {
  new User().validateEmployeeToken(request, response)
})

app.get("/api/v1/billedclients", (req, res) => {
  getBilledClients(req, res)
})

app.get("/api/v1/billing", function (request, response) {
  getClientBillingInformation(request, response)
})

app.put("/api/v1/billing", function (request, response) {
  updateBilling(request, response)
})

// sample api endpoint

app.get("/api/v1/sample", function (request, response) {
  const { count, page } = request.query
  let sampleHandle = new SampleHandler(request, response)
  sampleHandle.getCollectedSamples(count, page)
})

app.put("/api/v1/sample", function (request, response) {
  const sampleHandle = new SampleHandler(request, response)
  sampleHandle.updateRecords(request, response)
})

app.get("/api/v1/activation", (req, res) => {
  const Keys = Object.keys(req.query)
  if (Keys.includes("action") && Keys.includes("patientid")) {
    activation.activateDeactivate(req, res)
  } else {
    activation.getPartialData(req, res)
  }
})
app.get("/api/v1/activation/registered", async (req, res) => {
  const { count, page } = req.query;
  const query = ` SELECT id,
        patientid,
        CASE 
          WHEN middlename IS NULL THEN CONCAT(firstname, ' ', lastname)
          ELSE CONCAT(firstname, ' ', middlename, ' ', lastname)
        END AS fullname,
        date,
        mobile_number AS contact,
        activation_status
        FROM new_patients
        WHERE date = CURRENT_DATE ORDER BY ID DESC  LIMIT ? OFFSET ?`;

  const result = await paginationQuery({ count, page }, query);
  res.send(result);

})
app.get("/api/v1/activation/bulk", (req, res) => {
  activation.activateDeactivate(req, res)
})

app.get("/api/v1/center", (req, res) => {
  get(req, res)
})

// const targetHour = 18

// const upDateInventoryAnalyticSummary = async () => {
//   try {
//     const currentHour = new Date().getHours()
//     if (currentHour === targetHour) {
//       await new Inventoryanalytics().updateInvenAnalSummary()
//     }
//   } catch (err) {
//     console.log(err)
//   }
// }

// upDateInventoryAnalyticSummary()

app.get("/email/templates", async function (request, response) {
  var path = require('node:path')
  response.render(path.join(__dirname, './api/views/templates/sampleRejection.ejs'), { data: { labname: 'Vitalscan laboratory', header: 'sample rejection notice' } })
})


app.get('/api/v1/cachedata/getSavedrecords', async function (request, response) {
  const result = await promisifyQuery(`SELECT * FROM customtestcreation`);
  response.send(result);
})


// app.get('/verify-email', (req, res) => {
//   const data = {
//     supplierName: 'John Doe',
//     verificationLink: 'https://example.com/verify/1234567890abcdef'
//   };

//   // Render the EJS template with dummy data
//   ejs.renderFile('./api/EmailTemplates/supplierEmailVerification.ejs', data, (err, html) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send('Error rendering template');
//     } else {
//       res.send(html);
//     }
//   });
// });

