const { customError, promisifyQuery, rowAffected, paginationQuery } = require("../../../helper");
const logger = require("../../../logger");
const User = require("../../LobnosAuth/user");
const { readdir, unlink } = require("node:fs/promises");

class Expenses {
      constructor(employeeid, branchid) {
            this.employeeid = employeeid;
            this.branchid = branchid;
      }

      isExpenseApproved() {

      }
      getAdminRequest() {

      }

      getRequest() {
            if (!this.employeeid || this.branchid) {
                  throw new Error('branchid or employeeid not provided');
            }

      }

      async generateNewExpense(data, response) {
            try {
                  if (Object.keys(data).length == 0 || typeof data != 'object') {
                        throw new TypeError('object with keys required');
                  }
                  const { employeeid, branchid, name, date, merchant, amount, mode, description, category } = data;

                  if (!employeeid || !branchid || !name) {
                        return customError('name, employeeid, branchid required', 404, response);
                  }
                  if (category == 0 || !category) return customError('category id not provided', 404, response);
                  const query = `INSERT INTO expensesrecord (name,amount,mode,employeeid,branchid,description,merchant,category,date) VALUES(?,?,?,?,?,?,?,?,?)`;
                  let inserted = await promisifyQuery(query, [name, amount, mode, employeeid, branchid, description, merchant, category, date]);

                  inserted = rowAffected(inserted);
                  response.send({ status: inserted ? 'success' : 'failed' })
            } catch (err) {
                  logger.error(err?.message)
            }
      }


      async getExpensesRecord(employeeid, branchid, status, pageQuery = { count: 10, page: 1 }, from, to, state) {
            const record = await new User().userExistWithId(employeeid);

            let role = undefined;
            let query = `SELECT 
                er.name,
                er.description,
                er.merchant,
                r.username,
                er.approved,
                er.date,
                er.createdon,
                er.id,
                er.employeeid,
                er.amount
            FROM expensesrecord AS er INNER JOIN roles AS r ON r.employeeid = er.employeeid`;
            let values = [];
            if (record.length > 0) {
                  role = record[0]['role'];
            }
            if (!['admin', 'manager'].includes(role)) {
                  query += ` WHERE er.employeeid = ? AND er.branchid = ?`;
                  values = [employeeid, branchid];
            } else {
                  query += ` WHERE er.employeeid = ?`;
                  values = [employeeid];
            }

            if (status && status == "approved") {
                  query += ` AND er.approved = 1`;
            } else if (status && status == 'rejected') {
                  query += ` AND er.approved = 2`;
            } else if (status && status == "pending") {
                  query += ` AND er.approved = 0`;
            } else {
                  query = query;
            }

            if (from && to) {
                  query += ` AND er.date BETWEEN ? AND ?`;
                  values.push(from, to);
            }

            if (state) {
                  query += ` AND er.state = ?`;
                  values.push(state);
            }

            query += ` LIMIT ? OFFSET ?`;
            return await paginationQuery(pageQuery, query, values);
      }

      async getExpenseImageList(expenseid) {
            try {
                  let images = await readdir('api/uploads/receipts')
                  if (images.length > 0) {
                        images = images.filter((item) => item.split("-")[0] == expenseid);
                  }
                  return images;
            } catch (err) {
                  throw err?.message || err;
            }
      }

      async getSingleExpense(expenseid) {
            let result = await promisifyQuery(`SELECT * FROM expensesrecord WHERE id = ?`, [parseInt(expenseid)])
            if (result.length > 0) {
                  let images = await this.getExpenseImageList(expenseid);
                  result[0]['images'] = images;
                  return result
            }
            return result;
      }

      async deleteReceiptsList(data) {
            if (!data) {
                  throw new Error('data not provided');
            }
            if (data && !Array.isArray(data)) {
                  throw new TypeError('Array required');
            }
            if (data.length == 0) return;
            const status = await Promise.all(data.map(async (item) => {
                  try {
                        await unlink(`api/uploads/receipts/${item}`)
                  } catch (err) {
                        return false;
                  }
            }))
            return status.some((a) => a == false) ? false : true;
      }


      async calculateDailyExpense(requireddate) {
            let query = `SELECT SUM(amount) AS expense FROM expensesrecord WHERE DATE(date) = ? AND approved = 1`;
            if (this.branchid) {
                  query += ` AND branchid = ${this.branchid}`;
            }
            let result = await promisifyQuery(query, [requireddate ? requireddate : `CURRENT_DATE`]);
            if (result.length > 0) {
                  result = result[0]['expense'];
            }
            return result;
      }

      async calCurrentMonthExpense(month) {
            if (month && typeof month != 'number') {
                  throw TypeError('argument must empty if current month required or a integer of the month interested provided');
            }
            let query = `SELECT SUM(amount) AS expense FROM expensesrecord WHERE`;
            if (month) {
                  query += ` MONTH(date) = ? AND approved = 1`
            } else {
                  query += ` MONTH(date) = MONTH(CURRENT_DATE) AND approved = 1`
            }
            let result = await promisifyQuery(query, [month]);
            if (result.length > 0) {
                  result = result[0]['expense'];
            }
            return result;
      }

      async calculateYearlyExpense(year) {
            let query = `SELECT SUM(amount) AS expense FROM expensesrecord WHERE`;
            if (year) {
                  query += ` YEAR(date) = ? AND approved = 1`
            } else {
                  query += ` YEAR(date) = YEAR(CURRENT_DATE) AND approved = 1`
            }
            let result = await promisifyQuery(query, [year]);
            if (result.length > 0) {
                  result = result[0]['expense'];
            }
            return result;
      }
      async getMonthlySummary() {
            let report = {};
            let current = 0;
            while (current <= 12) {
                  const result = await this.calCurrentMonthExpense(current);
                  report[current] = result;
                  current++;
            }
            return report;
      }

      async updateExpenseDecision(status, expenseid, information, employeeid) {
            if (!expenseid || !status || !employeeid) {
                  throw new Error('status,employeeid and expenseid must be provided');
            }
            let statusNumber = null;
            let values = [];
            if (status == "pending") {
                  statusNumber = 0;
            } else if (status == "rejected") {
                  statusNumber = 2
            } else if (status == "approved") {
                  statusNumber = 1
            } else {
                  statusNumber = undefined;
            }
            let query = `UPDATE expensesrecord SET approved = ? , approvedon = NOW(), approvedby = ?`;
            values.push(statusNumber);
            values.push(employeeid);

            if (statusNumber == 2) {
                  query += `,rejectionMessage = ?`
                  values.push(information);
            }
            query += ` WHERE id = ?`;
            values.push(expenseid);
            return rowAffected(await promisifyQuery(query, values));
      }

      async getAllExpenseCategory() {
            return await promisifyQuery("SELECT * FROM `dbo.expensecategory`");
      }

      async isExpenseExist(category) {
            if (!category) throw new TypeError('category not needed');
            const query = "SELECT * FROM `dbo.expensecategory` WHERE category = ?";
            const row = await promisifyQuery(query, [category]);
            return row.length > 0 ? true : false;
      }


      async createExpenseCategory(category, employeeid) {
            if (!category) throw new ReferenceError('category not provided');
            if (typeof category != 'string') throw new TypeError('category must be type string');
            if (isNaN(employeeid)) {
                  throw new TypeError(employeeid + "must be type number");
            }
            if (await this.isExpenseExist(category)) {
                  return `category exist`;
            }

            const query = "INSERT INTO `dbo.expensecategory` (category,employeeid) VALUES (?,?)";
            const isInserted = await promisifyQuery(query, [category,employeeid]);
            return rowAffected(isInserted);
      }

      async updateExpenseCategory(editid, category) {
            if (!editid || !category) {
                  throw new Error('category and editid not provided');
            }
            const query = "UPDATE `dbo.expensecategory` SET category = ? WHERE id = ?";
            return rowAffected(await promisifyQuery(query,[category,editid]))
      }
}





module.exports = Expenses;
