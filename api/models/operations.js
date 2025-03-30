const { customError, promisifyQuery, paginationQuery, responseError } = require("../../helper");
const logger = require("../../logger");
const connection = require("../db");

class Operations {
  constructor(billingid) {
    this.billingid = billingid;
    this.validBillingid = async function () {
      const result = await promisifyQuery(`SELECT * FROM billing WHERE billingid = ?`, [this.billingid]);
      return result.length === 0;
    };
  }

  async readyforTest() {
    const validId = await this.validBillingid();
    if (!validId) {
      return "Invalid billingid";
    }
    if (validId) {
      const queryString = `SELECT * FROM samplestatus WHERE billingid = ? AND approvalstatus= 1`;
      const result = await promisifyQuery(queryString, [this.billingid]);
      return result.length === 0 ? false : true;
    }
  }

  billingTest = async (request) => {
    const certified = await this.readyforTest();

    const { departmentid } = request.query;

    if (certified) {
      // we want to return  all test for the billingid from the test_ascention table to join testpanel table where testid = testid
      let queryString = `SELECT ta.testid,
                tp.name,
                ta.billingid,
                tp.category,
                ta.processing,
                ta.processing_date,
                ta.ready,
                ta.ready_date
              FROM test_ascension as ta
                INNER JOIN test_panels as tp ON ta.testid = tp.id
                INNER JOIN departments AS d ON d.id = tp.category
              WHERE ta.billingid = ${this.billingid}`;

      if (departmentid != "undefined") {
        if (departmentid != "all") {
          queryString += ` AND tp.CATEGORY = ${departmentid}`;
        }
      }

      queryString += ` AND ta.collection = 'true' AND ta.ready='false'  AND d.department <> 'ultrasound' `;

      return new Promise((resolve, reject) => {
        connection.query(queryString, (err, result) => {
          err ? reject(err) : result.length === 0 ? resolve([]) : resolve(result);
        });
      });
    } else {
      return "Billingid is not ready for testing";
    }
  };

  getAllReadyTest = async (request) => {
    const { category } = request.query;
    //  we want to return all test where the approvalstatus of the sample is true
    // for processing and result entry
    let queryString = `
        SELECT 
          CASE 
            WHEN np.middlename IS NULL THEN CONCAT(
              np.middlename,
              ' ',
              np.lastname
            )  ELSE CONCAT(  np.firstname,
              ' ',
              np.middlename,
              ' ',
              np.lastname) END AS FULLNAME,
          np.patientid,
          b.billingid,
          tp.category
        FROM new_patients as np
          INNER JOIN billing as b ON np.patientid = b.PATIENTID
          INNER JOIN test_ascension AS ta ON ta.billingid = b.BILLINGID
          INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
          INNER JOIN test_panels AS tp ON tp.ID = ss.testid
          INNER JOIN departments AS d ON d.ID = tp.category
        WHERE ss.approvalstatus = 1 AND DATE(b.billedon) = CURRENT_DATE
    `;
    if (category != "all") {
      queryString += ` AND tp.CATEGORY = ${category}`;
    }

    queryString += ` AND ta.collection = 'true' AND ta.ready='false' AND d.department <> 'ultrasound' 
    GROUP BY np.patientid ORDER BY b.billingid ASC LIMIT 20`;

    return await promisifyQuery(queryString);
  };

  initiateStart = async (testid, billingid) => {
    // update test ascension table with the testid, datetime and the billing id
    const queryString = `UPDATE test_ascension SET processing_date = NOW(),
    processing = 'true'  WHERE billingid = ? AND testid = ?`;
    return await promisifyQuery(queryString, [billingid, testid]);
  };

  initiateReady = async (testid, billingid) => {
    // update test ascension table with the testid, datetime and the billing id and ready = true and ready_date = NOW()

    const queryString = `UPDATE test_ascension SET ready_date = NOW(),ready = 'true'  WHERE billingid = ${billingid} AND testid = ${testid}`;

    return new Promise((resolve, reject) => {
      connection.query(queryString, (err, result) => {
        err ? reject(err) : result.affectedRows === 0 ? resolve({ affectedRows: 0 }) : resolve({ affectedRows: 1 });
      });
    });
  };

  async getAllPendingCases(count, page, department, status, testid, response, fullname) {
    try {
      let query = `SELECT 
          CONCAT( np.firstname,' ',np.middlename,' ',np.lastname) AS fullname,
          CONCAT(np.age," ",np.agetype) AS age,
          np.patientid,
          b.billingid ,
          tp.category,
          d.department,
          tp.name,
          b.clinician,
          ss.approvalstatus,
          ta.ready,
          ta.processing,
          ta.ascension,
          tp.id,
          b.clientstatus,
          CASE WHEN b.organization <> 0 THEN
          (SELECT name FROM organization WHERE id = b.organization)
          END AS organization,
          CASE WHEN b.clinician <> 0 THEN
           (SELECT name FROM clinicianbasicinfo WHERE id = b.clinician)
          END AS clinicianName
      FROM new_patients AS np
        INNER JOIN billing AS b ON np.patientid = b.patientid
        INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
        INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
        INNER JOIN test_panels AS tp ON tp.id = ss.testid
        INNER JOIN departments AS d ON d.id = tp.category 
        WHERE ss.approvalstatus = 1 AND ta.collection = 'true'
        AND d.department <> 'ultrasound'
      `;
      const values = [];
      if (department) {
        if (department == "all") {
          query = query;
        } else {
          query += ` AND d.id = ?`;
          values.push(department);
        }
      }

      if (status === "completed") {
        query += ` AND ta.ready='true'`;
      } else if (status === "pending") {
        query += ` AND ta.ready='false'`;
      } else {
        query = query;
      }

      if (testid && !isNaN(testid)) {
        query += ` AND ta.testid = ?`;
        values.push(testid);
      }

      query += ` ORDER BY b.billingid DESC
    LIMIT ? OFFSET ?`;

      const result = await paginationQuery({ count, page }, query, values);
      if (response) {
        response.send({ status: "success", result, statusCode: 200 });
      } else {
        return result;
      }
    } catch (err) {
      logger.error(err);
      console.log(err);
    }
  }

  operationsOverview = async function (request, response) {
    const { stage } = request.query;

    if (!stage) {
      customError("stage of tests required", 401);
    } else {
      let queryString = `
          SELECT COUNT(*) AS count, d.department,d.id AS departmentid from test_ascension AS ta
          INNER JOIN test_panels AS tp ON tp.id = ta.testid
          INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
          INNER JOIN billing AS b ON b.billingid = ta.billingid
          INNER JOIN departments AS d ON d.id = tp.category
          WHERE ta.collection = 'true'
        `;

      if (stage == "unentered") {
        queryString += ` AND ta.ready = 'false'`;
      }

      if (stage == "entered") {
        queryString += ` AND ta.ready = 'true'`;
      }

      queryString += ` AND d.department <> 'ultrasound' AND DATE(b.billedon) = CURRENT_DATE`;

      queryString += ` GROUP BY d.department,d.id,ta.id`;

      const result = await promisifyQuery(queryString);

      response.send({ result, status: "success", statusCode: 200 });
    }
  };
  getAllEnterResult = async function (request, response) {
    const { from, to, patientid, billingid, sortingwise, count, page } = request.query;
    let queryString = `SELECT  CONCAT(  np.FIRSTNAME,
                  ' ',
                  np.MIDDLENAME,
                  ' ',
                  np.LASTNAME) AS fullname,
                np.PATIENTID AS patientid,
                np.gender,
                b.BILLINGID AS billingid,
                b.billedon AS billing_date,
                tp.CATEGORY AS category
              FROM new_patients as np
                INNER JOIN billing as b ON np.PATIENTID = b.PATIENTID
                INNER JOIN samplestatus AS ss ON ss.billingid = b.BILLINGID
                INNER JOIN test_ascension AS ta ON ta.billingid = b.BILLINGID
                INNER JOIN test_panels AS tp ON tp.ID = ss.testid
                INNER JOIN departments AS d ON d.ID = tp.CATEGORY
            `;
    queryString += ` WHERE ss.approvalstatus = 1 AND d.department <> 'ultrasound'`;

    if (from && !to) {
      queryString += ` AND DATE(b.billedon) BETWEEN '${from}' AND CURRENT_DATE`;
    } else if (from && to) {
      queryString += ` AND DATE(b.billedon) BETWEEN '${from}' AND  '${to}'`;
    } else {
      queryString = queryString;
    }

    if (patientid) {
      queryString += ` AND np.PATIENTID = ${patientid}`;
    }

    if (billingid) {
      queryString += ` AND b.billingid = ${billingid}`;
    }

    queryString += ` GROUP BY b.billingid DESC LIMIT 30`;

    let result = await promisifyQuery(queryString);

    if (result.length > 0) {
      const getTestQuery = ` SELECT ta.testid,
                          tp.name,
                          ta.billingid,
                          tp.category,
                          ta.processing,
                          ta.processing_date,
                          ta.ready,
                          ta.ready_date
                        FROM test_ascension as ta
                          INNER JOIN test_panels as tp ON ta.testid = tp.ID
                          INNER JOIN departments AS d ON d.id = tp.CATEGORY
       WHERE ta.billingid = ?`;
      result = await Promise.all(result.map(async (item, index) => {
        const { billingid } = item;
        if (billingid) {
          const test_outcome = await promisifyQuery(getTestQuery, [parseInt(billingid)]);
          item.testMap = test_outcome;
        }
        return item;
      }));
    }
    response.send({
      statusCode: 200,
      status: "success",
      result,
    });
  };

  getAllTestPreview = async function (request, response) {
    const { billingid } = request.query;

    if (billingid) {
      const queryString = `
            SELECT ta.testid,
            tp.NAME,
            ta.billingid,
            tp.CATEGORY,
            ta.processing,
            ta.processing_date,
            ta.ready,
            ta.ready_date
          FROM test_ascension as ta
            INNER JOIN test_panels as tp ON ta.testid = tp.ID
            INNER JOIN departments AS d ON d.id = tp.CATEGORY
          WHERE ta.billingid = ${billingid}
      `;

      connection.query(queryString, (err, result) => {
        if (err) {
          customError(err.message, 500);
        } else {
          response.send({
            statusCode: 200,
            result,
            status: "success",
          });
        }
      });
    } else {
      customError("billingid is required", 400);
    }
  };

  async getUltrasoundWaitingList(request, response) {
    const { count = 10, page = 1 } = request.query;
    const queryString = ` 
    SELECT DISTINCT
    CASE 
        WHEN MIDDLENAME IS NULL THEN CONCAT(
            np.FIRSTNAME,
            ' ',
            np.LASTNAME
          )  ELSE CONCAT(  np.FIRSTNAME,
            ' ',
            np.MIDDLENAME,
            ' ',
            np.LASTNAME) END AS fullname,
    np.patientid,
    b.billingid,
    b.billedon,
    tp.name,
    tp.ID AS testid,
    tp.category,
    d.department
  FROM new_patients as np
    INNER JOIN billing as b ON np.PATIENTID = b.patientid
    INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
    INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
    INNER JOIN test_panels AS tp ON tp.ID = ta.testid
    INNER JOIN departments AS d ON d.ID = tp.CATEGORY
  WHERE  d.department = 'ultrasound' AND ta.ready = 'false' LIMIT ? OFFSET ?`;

    const result = await paginationQuery({ count, page }, queryString);

    response.send({ statusCode: 200, result, status: "success" });
  }

  async processedScanList(request, response) {
    try {
      const { count = 10, page = 1 } = request.query;
      const { from, to, search } = request.query;
      let query = `
      SELECT DISTINCT
      CASE 
          WHEN MIDDLENAME IS NULL THEN CONCAT(
              np.FIRSTNAME,
              ' ',
              np.LASTNAME
            )  ELSE CONCAT(  np.FIRSTNAME,
              ' ',
              np.MIDDLENAME,
              ' ',
              np.LASTNAME) END AS fullname,
      np.patientid,
      b.billingid,
      b.billedon,
      tp.name,
      tp.ID AS testid,
      tp.category,
      ta.ready,
      d.department
    FROM new_patients as np
      INNER JOIN billing as b ON np.PATIENTID = b.patientid
      INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
      INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
      INNER JOIN test_panels AS tp ON tp.ID = ta.testid
      INNER JOIN departments AS d ON d.ID = tp.CATEGORY
    WHERE  d.department = 'ultrasound' AND ta.ready ='true'
      `;
      const values = [];
      if (from && to) {
        query += ` AND DATE(b.billedon) BETWEEN ? AND ?`;
        values.push(`${from}`);
        values.push(`${to}`);
      } else if (from && !to) {
        query += `  AND DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`;
        values.push(`${from}`);
      } else {
        query = query;
      }

      if (search) {
        query += ` AND (CONCAT(np.firstname," ",np.middlename," ",np.lastname) LIKE ? 
        OR np.MOBILE_NUMBER = ?)`;
        values.push(`%${search}%`);
        values.push(search);
      }
      if (!from && !to) {
        query += ` ORDER BY b.BILLINGID ASC  LIMIT ? OFFSET ?`;
      }
      console.log(values);

      const result = await paginationQuery({ count, page }, query, values);

      response.send({ result, statusCode: 200, status: "success" });
    } catch (err) {
      console.log(err);
      responseError(response);
    }
  }
}

module.exports = Operations;
