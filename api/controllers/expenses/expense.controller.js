const router = require("express").Router();
const { customError, responseError, promisifyQuery } = require("../../../helper");
const Expenses = require('../../models/Expenses/Expense');
const multer = require("multer");
const path = require("node:path");

const storage = multer.diskStorage({
      destination: function (req, file, cb) {
            cb(null, 'api/uploads/receipts');
      },
      filename: function (req, file, cb) {
            cb(null, req.query.id + '-' + Date.now() + path.extname(file.originalname));
      }
});

const upload = multer({ storage: storage });

router.post("/api/v1/expenses", async function (request, response) {
      new Expenses().generateNewExpense(request.body, response);
})

router.get('/api/v1/expenses/records', async function (request, response) {
      const { employeeid, branchid, count, page, status, from, to } = request.query;
      if (!employeeid) {
            return customError('employeeid required', 404, response);
      }
      const records = await new Expenses().getExpensesRecord(employeeid, branchid, status, { page, count }, from, to);
      response.send(records);
})

router.get('/api/v1/expenses/record/single', async function (request, response) {
      try {
            const { expenseid } = request.query;
            if (!expenseid) {
                  return customError(`expenseid not provided`, 404, response);
            }
            const record = await new Expenses().getSingleExpense(expenseid);
            response.send(record);
      } catch (err) {
            if (err?.message) {
                  response.send({ status: 'error', err })
            } else {
                  return responseError(response);
            }
      }
})



router.post('/api/v1/expenses/receipt/upload', upload.array("images", 10), async function (request, response) {
      try {
            response.send({ status: "success" })
      } catch (err) {
            console.log(err);
      }
})

router.get('/api/v1/expenses/receipt/upload/images', async function (request, response) {
      try {
            const { imageid } = request.query;
      if (!imageid) {
            return customError(`image not provided`, 404, response);
      }
      response.sendFile(path.join(__dirname, `../uploads/receipts/${imageid}`))
      } catch (err) {
            responseError(response);
      }
})

router.get('/api/v1/expenses/receipt/uploaded/images/list', async function (request, response) {
      const { expenseid } = request.query;
      if (!expenseid) {
            return customError(`expenseid not provided`, 404, response);
      }
      let result = await new Expenses().getExpenseImageList(expenseid);
      response.send(result);
})

router.delete('/api/v1/expenses/receipt/uploaded/images', async function (request, response) {
      const { data } = request.body;
      if (data && Array.isArray(data) && data.length > 0) {
            const status = await new Expenses().deleteReceiptsList(data)
            response.send({ status: status ? "success" : 'failed' })
      } else {
            return customError('image List not provided', 404, response);
      }
})



router.post("/api/v1/expense/pending/decision", async function (request, response) {
      try {
            const { expenseid, employeeid, status, information } = request.body;
            const result = await new Expenses().updateExpenseDecision(status, expenseid, information, employeeid);
            response.send({ status: result === true ? 'success' : 'failed' });
      } catch (err) {
            responseError(response)
      }
})


router.post("/api/v1/expense/new/category", async function (request, response) {
      try {
            const { category, employeeid } = request.body;
            if (!employeeid || !category) {
                  return customError('employeeid and expense category required', 404, response);
            }
            const expenseCreation = await new Expenses().createExpenseCategory(category, employeeid);
            if (typeof expenseCreation == "boolean") {
                  return expenseCreation == true
                        ?
                        response.send({ message: 'category created successfully', statusCode: 200, status: 'success' })
                        :
                        response.send({ message: 'category creation failed', statusCode: 200, status: 'failed' })
            }

            if (typeof expenseCreation == "string" && expenseCreation == "category exist".trim()) {
                  response.send({ message: 'category already exist', statusCode: 200, status: "success" })
            }
      } catch (err) {
            console.log(err)
            responseError(response)
      }
})

router.put("/api/v1/expense/new/category", async function (request, response) {
      try {
            const { category, employeeid, editid } = request.body;
            if (!employeeid || !category || !editid) {
                  return customError('employeeid, expense category and category id required', 404, response);
            }
            const updateExpenseCategory = await new Expenses().updateExpenseCategory(editid, category);
            return response.send({ status: updateExpenseCategory });

      } catch (err) {
            responseError(response)
      }
})


router.get("/api/v1/expense/get/category", async function (request, response) {
      try {
            const expensecategories = await new Expenses().getAllExpenseCategory();
            response.send(expensecategories);
      }
      catch (err) {
            responseError(response)
      }
})
module.exports = router;