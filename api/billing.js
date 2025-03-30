const connection = require("./db");
const { checkpatient } = require("./register");
const logger = require("../logger");
const { customError, promisifyQuery, rowAffected } = require("../helper");
const { getApplicationSettings } = require("./models/applicationSettings");
const EmailService = require("./EmailServices/EmailCore");
const applicationSettings = require("./models/applicationSettings");

/**
 * The `Billing` class is responsible for handling billing operations, such as inserting new billing records, updating billing history, checking if a billing is valid for day entry, and adding tests to the test ascension table.
 *
 * @example
 * const billing = new Billing(patientid, clinician, organization, test, payable, testcost, paid, taxIncluded, taxValue, status, discount, paymentmode, samplingCenter, outstanding, cost);
 * billing.insetionProcess(request, response);
 *
 * @class
 */
class Billing {
  constructor(
    patientid,
    clinician,
    organization,
    test,
    payable,
    testcost,
    paid,
    taxIncluded,
    taxValue,
    status,
    discount,
    paymentmode,
    samplingCenter,
    outstanding,
    cost
  ) {
    this.patientid = patientid;
    this.clinician = clinician;
    this.organization = organization;
    this.test = test;
    this.payable = payable;
    this.testcost = testcost;
    this.paid = paid;
    this.taxIncluded = taxIncluded;
    this.taxValue = taxValue;
    this.status = status;
    this.discount = discount;
    this.paymentmode = paymentmode;
    this.samplingCenter = samplingCenter;
    this.outstanding = outstanding;
    this.cost = cost;
  }

  insertNewBilling = async function (employeeid) {
    const query = `INSERT INTO billing(patientid,clinician,organization,paid_amount,payable,type,outstanding,discount,branchid,taxIncluded,taxValue,clientstatus,testcost,employeeid)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
      this.patientid,
      this.clinician || 0,
      this.organization || 0,
      this.paid,
      this.payable,
      this.paymentmode,
      this.outstanding,
      this.discount,
      this.samplingCenter,
      this.taxIncluded,
      this.taxValue,
      this.status,
      this.testcost,
      employeeid,
    ];

    try {
      const { affectedRows, insertId } = await promisifyQuery(query, values);
      return affectedRows > 0 ? insertId : false;
    } catch (err) {
      logger.error(err);
      throw new Error(err.message);
    }
  };

  updateBillingHistory = async function (billingid) {
    const query = `UPDATE billinghx SET paymentMode = ?,Amount = ? WHERE billingid = ?`;
    const values = [this.paymentmode, this.paid, billingid];
    return promisifyQuery(query, values);
  };

  isCompleteFlow = async function () {
    try {
      const settings = await getApplicationSettings();
      if (settings && settings.length > 0) {
        return settings[0]["completeFlow"] == 1 ? true : false;
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  updateApprovalStatus = async function (billingid, testid) {
    try {
      const query = `UPDATE samplestatus SET approvalstatus = 1 WHERE billingid = ? AND testid = ?`;
      const values = [billingid, testid];
      return promisifyQuery(query, values);
    } catch (err) {
      throw new Error(err);
    }
  };

  isValidForDayEntry = async function (patientid) {
    const query = `SELECT COUNT(*) AS count FROM billing WHERE patientid = ? AND DATE(billedon) = CURRENT_DATE`;
    try {
      const result = await promisifyQuery(query, patientid);
      return result[0]["count"] > 0 ? false : true;
    } catch (err) {
      logger.error(err);
      throw new Error(err);
    }
  };

  async AddtoTestAscenstion(billingid, testidCollection) {
    try {
      const testCollection = testidCollection ? testidCollection : this.test;
      if (Array.isArray(testCollection) && testCollection.length == 0) return false;
      const query = `INSERT INTO test_ascension (testid,billingid,collection,collection_date)
      VALUES(?,?,?,CURRENT_DATE)`;
      // if settings is a complete flow, then we need to make sure the collection is false,else true for collection and approval status
      const status = (await this.isCompleteFlow()) == 0 ? "false" : "true";
      testCollection.map(async (item, index) => {
        await promisifyQuery(query, [item, billingid, status == "false" ? "true" : "false"]);
        if (status == "false") await this.updateApprovalStatus(billingid, item);
      });
      return true;
    } catch (err) {
      logger.error(err);
      throw new Error(err?.message || err);
    }
  }

  async deleteAscensionid(billingid, testid) {
    const query = `DELETE FROM test_ascension WHERE testid = ? AND billingid = ?`;
    const result = await promisifyQuery(query, [parseInt(billingid), parseInt(testid)]);
    return rowAffected(result);
  }

  async insertionProcess(request, response, employeeid, strict = true) {
    /* strict entering is enforced at the center, but incase an order is made by a clinician
  allow the order to go through or when strict daily enformcement is deactivated at the facillity level*/
    try {
      let canInitiateNewBill = true;
      if (strict) {
        canInitiateNewBill = await this.isValidForDayEntry(this.patientid);
      }

      if (!canInitiateNewBill) {
        return `client billed on same day. Kindly check the billing history to update billing`;
      }
      const billingid = await this.insertNewBilling(employeeid);
      connection.beginTransaction(async (err) => {
        if (err) {
          logger.error(err);
          throw new Error(err);
        }
        const billingid = await this.insertNewBilling(employeeid);
        console.log(billingid);
        if (!billingid) {
          connection.rollback();
          throw new Error("billing failed");
        }
        await this.AddtoTestAscenstion(billingid);
        await this.updateBillingHistory(billingid);
        connection.commit(async (err) => {
          if (err) {
            logger.error(err);
            connection.rollback();
            throw new Error(err);
          }
        });
      });
      return true;
    } catch (err) {
      console.log(err);
      connection.rollback((err) => {
        logger.error(err);
        throw new Error(err);
      });
    }
  }
  async clientPaymentStatus(patientid) {
    try {
      const query = `SELECT
      SUM(PAID_AMOUNT) AS paidAmount,
          SUM(PAYABLE) AS totalcostincurred,
          CASE
            WHEN SUM(PAID_AMOUNT) = SUM(PAYABLE) THEN 1
            WHEN SUM(PAID_AMOUNT) > SUM(PAYABLE) THEN -1
            WHEN SUM(PAID_AMOUNT) < SUM(PAYABLE) THEN 0
          END AS status
          FROM BILLING
      WHERE PATIENTID = ?`;
      const result = await promisifyQuery(query, patientid);
      let status = result[0]["status"];
      if (status == null) {
        const isExist = await checkpatient(patientid);
        isExist ? (status = 1) : (status = null);
        return status;
      } else {
        return status;
      }
    } catch (err) {
      logger.error(err);
    }
  }

  async getClientBillingInformation(request, response) {
    //  get the billing id
    const { billingid } = request.query;
    // check if billing id is not empty
    if (billingid && billingid != "") {
      // join the billing and performing test table and new patients table using the aptient id wherw billing id is equal to the billing id
      let mysql = `SELECT
      SUM(PAID_AMOUNT) AS paidAmount,
          SUM(PAYABLE) AS totalcostincurred,
          CASE
            WHEN SUM(PAID_AMOUNT) = SUM(PAYABLE) THEN 1
            WHEN SUM(PAID_AMOUNT) > SUM(PAYABLE) THEN -1
            WHEN SUM(PAID_AMOUNT) < SUM(PAYABLE) THEN 0
          END AS status
          FROM BILLING
      WHERE PATIENTID = ?`;
      try {
        let result = await promisifyQuery(mysql, [billingid]);
        response.send({ message: "success", statusCode: 200, result });
      } catch (err) {
        customError(err?.message, 500, response);
      }
    } else {
      // if billing id is isNotEmptyFields
      customError("billing id is required", 400, response);
    }
  }

  async getDayBilledClientsCount(branchid, day, month, year) {
    let current_date = new Date();
    let current_month = current_date.getMonth() + 1;
    let current_day = current_date.getDate();
    let current_year = current_date.getFullYear();
    let date = "";
    if (year && month && day) {
      date = `${year}-${month}-${year}`;
    } else {
      date = `${current_year}-${current_month}-${current_day}`;
    }
    let query = `SELECT COUNT(*) AS count FROM billing WHERE DATE(billedon) ='${date}'`;

    if (branchid && !isNaN(branchid)) {
      query += ` AND branchid = ${parseInt(branchid)}`;
    }
    const count = await promisifyQuery(query);
    if (count.length > 0) {
      return count[0]["count"];
    }
    return 0;
  }
}

/**
 * 
 * @param {patientid} patientid this represent the unique id of the client throught out the lifespan of the application 
 * @returns promise  0,1,-1 0 means the facillity owns the client in terms of change,1 means paid amount = payables and 0 means client owns

 */
const clientPaymentStatus = async function (patientid) {
  try {
    const query = `SELECT
    SUM(PAID_AMOUNT) AS paidAmount,
  SUM(PAYABLE) AS totalcostincurred,
  CASE
    WHEN SUM(PAID_AMOUNT) = SUM(PAYABLE) THEN 1
    WHEN SUM(PAID_AMOUNT) > SUM(PAYABLE) THEN -1
    WHEN SUM(PAID_AMOUNT) < SUM(PAYABLE) THEN 0
  END AS status
  FROM BILLING
  WHERE PATIENTID = ?`;
    const result = await promisifyQuery(query, patientid);
    let status = result[0]["status"];
    if (status == null) {
      const isExist = await checkpatient(patientid);
      isExist ? (status = 1) : (status = null);
      return status;
    } else {
      return status;
    }
  } catch (err) {
    logger.error(err);
  }
};

const getClientBillingInformation = async function (request, response) {
  //  get the billing id
  const { billingid } = request.query;
  // check if billing id is not empty
  if (billingid && billingid != "") {
    // join the billing and performing test table and new patients table using the aptient id wherw billing id is equal to the billing id
    let mysql = `SELECT * FROM billing as b  INNER JOIN new_patients as n ON b.PATIENTID = n.PATIENTID WHERE b.BILLINGID = ?`;
    try {
      let result = await promisifyQuery(mysql, [billingid]);
      response.send({ message: "success", statusCode: 200, result });
    } catch (err) {
      customError(err?.message, 500, response);
    }
  } else {
    // if billing id is isNotEmptyFields
    customError("billing id is required", 400, response);
  }
};

const getBilledClients = async function (request, response) {
  const mysql = `
      SELECT b.billingid,
          CONCAT( np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
          b.paid_amount AS paid,
          b.payable,
          b.patientid,
          b.type,
          b.outstanding,
          pm.PaymentMode,
          b.discount,
          DATE(b.billedon) AS date
        FROM billing AS b
          INNER JOIN new_patients AS np ON np.patientid = b.patientid
          INNER JOIN billinghx AS bhx ON bhx.billingid = b.billingid
          INNER JOIN paymentmodes AS pm ON pm.KeyID = bhx.PaymentMode
          WHERE DATE(b.billedon) = CURRENT_DATE
    GROUP BY b.billingid
    ORDER BY B.billingid DESC
    LIMIT 20
  `;

  try {
    const result = await promisifyQuery(mysql);
    response.send({ message: "success", statusCode: 200, result });
  } catch (err) {
    customError(err?.message, 500, response);
  }
};

const updateBilling = async function (request, response) {
  /**
   * Updates a billing record in the database and handles the addition and removal of related test records.
   *
   * @param {object} request - The request object containing the data needed for updating the billing record.
   * @param {object} response - The response object used to send the result of the update operation.
   * @returns {void}
   */
  try {
    const { test, totalcost, billingid, outstanding, taxIncluded, taxValue, discount } = request.body;

    if (!test || !totalcost || !billingid || outstanding == null || outstanding < 0) {
      console.log(test, totalcost, billingid, outstanding);
      return customError("invalid request body", 404, response);
    }

    // update the billing table first
    const payable = taxValue + totalcost - discount;
    const updateCurrentBill = `UPDATE billing  SET testCost = ?, payable = ?, outstanding = ?
    WHERE billingid = ?`;

    // FLOW
    // 1. update billing table
    // 2. get all the test in the test_ascension table that has this paticular billingid
    // 3. compare ids in the test arayy with that in the db
    // 4. remove all test from the db that arrent in the test array
    // 5. add all test in the test array that arent in the test_ascention table
    // 6. all should be done using transactions so that if one shoudl fail then the commit should be roolled
    connection.beginTransaction(async function (err) {
      if (err) {
        logger.error(err);
      }
      const updateBilling = await promisifyQuery(updateCurrentBill, [totalcost, payable, outstanding, billingid]);
      const isUpdated = rowAffected(updateBilling);

      if (isUpdated) {
        const getBillAscensions = await promisifyQuery(`SELECT * FROM test_ascension WHERE billingid = ?`, [billingid]);
        const ascentionsDatabaseidx = getBillAscensions.map((item, index) => {
          return item.testid;
        });
        const userIdxCollections = test.map((item, index) => {
          return item.testid;
        });
        // we need to check to ensure only the test in idx collection are added and those that arent in idx collection but
        // are in the ascentionsDatabaseidx are removed
        const toDelete = [];
        const toAdd = [];
        const toIgnore = [];
        userIdxCollections.forEach(async (item, index) => {
          ascentionsDatabaseidx.includes(item) ? toIgnore.push(item) : toAdd.push(item);
        });

        ascentionsDatabaseidx.forEach(async (item, index) => {
          userIdxCollections.includes(item) ? (toIgnore.includes(item) ? null : toIgnore.push(item)) : toDelete.push(item);
        });

        const billing = new Billing();

        if (toAdd.length > 0) billing.AddtoTestAscenstion(billingid, toAdd);

        if (toDelete.length > 0) {
          toDelete.forEach(async (item, index) => {
            return billing.deleteAscensionid(billingid, item);
          });
        }

        connection.commit((err) => {
          if (err) {
            logger.error(err);
            connection.rollback((err) => {
              if (err) {
                logger.error(err);
              }
            });
          } else {
            response.send({ message: "update successful", statusCode: 200, status: "success" });
          }
        });
      }
    });
  } catch (err) {
    connection.rollback((err) => {
      logger.error(err);
    });
  }
};

module.exports = {
  Billing,
  updateBilling,
  getClientBillingInformation,
  getBilledClients,
};

new Billing().getDayBilledClientsCount();
