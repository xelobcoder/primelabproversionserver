const { promisifyQuery, customError, convertKeysToLowerCase, paginationQuery, rowAffected } = require("../helper")
const logger = require("../logger")
const connection = require("./db")
const EmailService = require("./EmailServices/EmailCore")
const applicationSettings = require("./models/applicationSettings")

class SampleHandler {
  constructor(request, response) {
    this.request = request
    this.response = response
  }

  async getCollectedSamples(count = 10, page = 1) {
    const SQL_QUERY = `
          SELECT DISTINCT
          b.PATIENTID,
          b.BILLINGID,
          b.billedon AS DATE,
        CASE WHEN np.MIDDLENAME IS NULL OR np.MIDDLENAME = ''
              THEN CONCAT(np.FIRSTNAME, ' ', np.LASTNAME)
              ELSE CONCAT(np.FIRSTNAME, ' ', np.LASTNAME, ' ', np.MIDDLENAME)
        END AS FULLNAME
        FROM billing AS b INNER JOIN  new_patients as np ON np.PATIENTID = b.PATIENTID
          INNER JOIN test_ascension AS ta ON ta.billingid = b.billingid
      INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
          WHERE ss.approvalstatus IS NULL AND ss.rejectionmessage IS NULL AND ta.collection = 'true'
          GROUP BY b.BILLINGID ORDER BY b.BILLINGID LIMIT ? OFFSET ?`
    try {
      let result = await paginationQuery({ count, page }, SQL_QUERY)
      if (result.length > 0) {
        result = result.map((item, index) => {
          return convertKeysToLowerCase(item)
        })
      }

      this.response.send({ statusCode: 200, status: "success", message: "success", result })
    } catch (err) {
      logger.error(err)
      customError("error fetching data", 500, this.response)
    }
  }
  async getDates(date) {
    let SQL_QUERY = `
    SELECT DISTINCT p.SAMPLE_STATUS,
      p.PATIENTID,
      p.BILLINGID,
      CASE WHEN np.MIDDLENAME IS NULL OR np.MIDDLENAME = ''
                      THEN CONCAT(np.FIRSTNAME, ' ', np.LASTNAME)
                      ELSE CONCAT(np.FIRSTNAME, ' ', np.LASTNAME, ' ', np.MIDDLENAME)
                END AS FULLNAME,
      p.DATE,
      p.MESSAGE,
      p.ID
     FROM PERFORMING_TEST as p
      join billing as b ON p.PATIENTID = b.PATIENTID
      join new_patients as np ON p.PATIENTID = np.PATIENTID
     WHERE p.DATE= ${date} ORDER BY p.BILLINGID DESC LIMIT 100    
    `
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        logger.error(err)
      }
      this.response.send(result)
    })
  }
  async getSelectedStutusAndDate(date, status) {
    if (date && status) {
      let SQL_QUERY = `
            SELECT DISTINCT p.SAMPLE_STATUS,
                p.PATIENTID,
                p.BILLINGID,
                p.MESSAGE,
                CASE WHEN np.MIDDLENAME IS NULL OR np.MIDDLENAME = ''
                      THEN CONCAT(np.FIRSTNAME, ' ', np.LASTNAME)
                      ELSE CONCAT(np.FIRSTNAME, ' ', np.LASTNAME, ' ', np.MIDDLENAME)
                END AS FULLNAME,
                p.DATE,
                p.ID
          FROM PERFORMING_TEST AS p
          JOIN billing AS b ON p.PATIENTID = b.PATIENTID
          JOIN new_patients AS np ON p.PATIENTID = np.PATIENTID
          WHERE p.DATE = '${date}' AND p.SAMPLE_STATUS = '${status}'
          ORDER BY p.BILLINGID DESC
          LIMIT 50
    `
      const result = await promisifyQuery(SQL_QUERY);
      if (this.response) return this.response({result,status:'success',statusCode: 200})
      else return result;
    }
  }
  getRecords() {
    let SQL_QUERY = `
      SELECT 
        CASE
          WHEN np.MIDDLENAME IS NULL THEN CONCAT(np.FIRSTNAME, ' ', np.LASTNAME)
          ELSE CONCAT(np.FIRSTNAME, ' ', np.MIDDLENAME, ' ', np.LASTNAME)
        END AS 'FULLNAME',
        ss.billingid AS 'BILLINGID',
        pt.DATE AS 'DATE',
        ( SELECT COUNT(billingid) FROM samplestatus WHERE approvalstatus = 0 
      AND billingid = pt.billingid) AS 'PENDINGCOUNT'
      FROM samplestatus as ss
      INNER JOIN performing_test as pt ON pt.BILLINGID = ss.billingid
      INNER JOIN new_patients as np ON np.PATIENTID = pt.PATIENTID
      GROUP BY ss.billingid
    ORDER BY pt.DATE DESC LIMIT 30
  `
    connection.query(SQL_QUERY, (err, result) => {
      if (err) {
        logger.error(err)
      } else {
        // check for pending  count in item of the result and only send those ABOVE 0
        let filteredResult = result.filter((item) => item.PENDINGCOUNT > 0)
        this.response.send(filteredResult)
      }
    })
  }

  async updateRecords(request, response) {
    try {
      const { testcollection } = request.body

      if (Array.isArray(testcollection) && testcollection.length > 0) {
        const SQL_QUERY = `UPDATE samplestatus 
              SET approvalstatus = ?,
              rejectionmessage = ?,
              samplevalidatedon = ?,
              validatedby =?
        WHERE billingid = ? AND testid = ? AND ascensionid = ?`
        // start transaction
        connection.beginTransaction(async (err) => {
          if (err) {
            logger.error(err)
          }
          testcollection.forEach(async (item, index) => {
            const { billingid, testid, id, rejectionmessage, approvalstatus, validatedon, validatedby } = item
            const message = approvalstatus == 1 ? null : rejectionmessage
            const values = [approvalstatus, message, validatedon, validatedby, billingid, testid, id]

            await promisifyQuery(SQL_QUERY, values)
            // commit transaction
            connection.commit()
            if (testcollection.length - 1 === index) {
              response.send({ statusCode: 200, status: "success", message: "record updated successfully " })
            }
            if (approvalstatus == 0 && applicationSettings.shouldSendRejectionEmail()) {
              await new EmailService().triggerSampleRejectionEmail(billingid, message)
            }
          })
        })
      } else {
        customError("invalid request", 400, response)
      }
    } catch (err) {
      logger.error(err)
      console.log(err)
      connection.rollback()
      customError("error updating data", 500, response)
    }
  }

  async getSampleRejectionStatus(testid, billingid) {
    const query = `SELECT * FROM samplestatus WHERE billingid = ?  AND approvalstatus = 0 AND testid = ?`
    const result = await promisifyQuery(query, [billingid, testid])
    if (result.length === 0) return null
    const { message, date } = result[0]
    return { message, date, billingid }
  }
  async getRejectedSamplesList(request, response) {
    const { count = 10, page = 1 } = request.query
    const SQL_QUERY = `
    SELECT 
           b.billingid,
            CONCAT(np.age," ",np.agetype) AS age,
            np.MOBILE_NUMBER AS mobileNumber,
            np.GENDER AS gender,
            np.EMAIL AS email,
            ss.rejectionmessage,
            b.billedon AS date,
            ss.approvalstatus,
            ss.sampleMessage,
            ss.disputedon,
            ss.ascensionid,
            ss.disputedby,
            ss.disputereason,
            tp.name,
            ss.testid,
            ss.samplevalidatedon,
            ro.username AS validatedBy,
            ta.collection_date,
            CASE
              WHEN np.MIDDLENAME IS NULL THEN CONCAT(np.FIRSTNAME, " ", np.LASTNAME)
              ELSE CONCAT(np.FIRSTNAME," ", np.MIDDLENAME," ",np.LASTNAME)
            END AS fullname
          FROM new_patients AS np
          INNER JOIN billing AS b ON b.patientid = np.patientid
          INNER JOIN samplestatus AS ss ON ss.billingid = b.billingid
          INNER JOIN test_ascension AS ta ON ta.id = ss.ascensionid
          INNER JOIN test_panels AS tp ON tp.id = ss.testid
          INNER JOIN departments AS d ON d.id = tp.category
          INNER JOIN roles AS ro ON ro.employeeid = ss.validatedby
          WHERE ss.approvalstatus = 0 AND ta.collection = 'true' AND d.department <> 'ultrasound' LIMIT ? OFFSET ?
    `
    try {
      let result = await paginationQuery({ count, page }, SQL_QUERY)
      if (result.length > 0 && Array.isArray(result)) {
        result = result.map((item, index) => {
          return convertKeysToLowerCase(item)
        })
      }
      response.send({ statusCode: 200, status: "success", message: "success", result })
    } catch (err) {
      logger.error(err)
      customError("error fetching data", 500, response)
    }
  }

  async rejectedSampleApproval(request, response) {
    const { action, billingid, manager, message } = request.body
    const query = `INSERT INTO manager_sample_descision (BILLINGID,ACTION,MESSAGE,MANAGER) VALUES (?,?,?,?)`
    const result = await promisifyQuery(query, [billingid, action, message, manager])
    if (response) response.send({ status: "success", message: "updated", statusCode: 200 })
    else return result
  }

  async disputeSampleRejection(request, response) {
    const { ascensionid, disputereason, disputedby, disputedon } = request.body
    if (!ascensionid || !disputedby || !disputereason) {
      return customError('ascensionid, disputereason, disputedby, disputedon missing', 404, response);
    }
    // we update sample status because we want to always retrieved last dispute without having to view log tabel
    const updateSample = async function () {
      promisifyQuery(`UPDATE samplestatus SET disputereason = ?, disputedby = ?, disputedon = ?
     WHERE ascensionid = ?`, [disputereason, disputedby, disputedon, ascensionid])
    }
    const DISPUTE_QUERY = `INSERT INTO rejectedsampledisputelog (ascensionid, disputereason, disputedby, disputedon)
    VALUES (?, ?, ?, ?)`;
    const values = [ascensionid, disputereason, disputedby, disputedon];

    try {
      const result = await promisifyQuery(DISPUTE_QUERY, values);
      if (rowAffected(result)) {
        updateSample();
        return response.send({ status: "success", message: "sample dispute logged successfully", statusCode: 200 })
      } else {
       return  response.send({ status: "error", message: "error logging sample dispute", statusCode: 500 })
      }
    } catch (err) {
      logger.error(err)
      return customError("error updating data", 500, response)
    }
  }

  async getSampleManagerValidation(request, response, billingid) {
    const query = "SELECT * FROM manager_sample_descision where BILLINGID = ?"
    const result = await promisifyQuery(query, [billingid])
    if (response) return response.send({ status: "success", statusCode: 200, result })
    else return result
  }


  async getSampleDisputeLog(request, response) {
    const { ascensionid, branch } = request.query;
    if (!ascensionid) {
      return customError(`provide ascensionid`, 404, response);
    }
    let result = await promisifyQuery(`
          SELECT * FROM rejectedsampledisputelog AS lg INNER JOIN roles AS rl ON rl.employeeid = lg.disputedby
            WHERE ascensionid = ? ORDER BY lg.id`,
      [parseInt(ascensionid)]);
    if (result.length > 0) {
      result = result.map((item, index) => {
        const { disputedby, disputedon, disputereason, username } = item;
        return { disputedby, disputedon, disputereason, branch, username };
      })
      return response.send(result);
    }
    response.send(result);
  }
}

module.exports = SampleHandler
