const { customError, promisifyQuery, convertKeysToLowerCase } = require('../../helper');
const logger = require('../../logger');
const connection = require('../db')

// use case scenario

// query data via billingid to get information
// about the rejected client sample and personal information


const getSampleManagerValidation = async function (request, response, billingid) {
  const query = 'SELECT * FROM manager_sample_descision where BILLINGID = ?';

  connection.query(query, billingid, function (err, result) {
    if (err) {
      response.send({
        status: 'error',
        err
      })
    }
    if (result) {
      response.send({
        status: 'success',
        statusCode: 200,
        result
      })
    }
  })
}



const getSampleList = async function (billingid, response) {
  const query = `
  SELECT 
    tp.NAME AS testname,
    tp.CATEGORY AS category
    FROM samplestatus AS ss INNER JOIN test_panels AS tp
    ON ss.testid = tp.ID
 WHERE ss.BILLINGID = ${billingid} AND ss.approvalStatus = 0 AND ss.message IS NOT NULL
  `;
  connection.query(query, [billingid], function (err, result) {
    if (err) {
      response.send({
        status: 'error',
        err
      })
    } else {
      response.send({
        statusCode: 200,
        result,
        status: 'success'
      })
    }
  })
}


const updateSamplerRecord = async function (request, response) { }



const rejectedSample = async function (request, response) {
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
          ss.disputedby,
          ss.disputereason,
          tp.NAME,
          ss.testid,
          ss.samplevalidatedon,
          ss.validatedby,
          ta.collection_date,
          CASE
            WHEN np.MIDDLENAME IS NULL THEN CONCAT(np.FIRSTNAME, " ", np.LASTNAME)
            ELSE CONCAT(np.FIRSTNAME," ", np.MIDDLENAME," ",np.LASTNAME)
          END AS fullname
        FROM new_patients AS np
        INNER JOIN billing AS b ON b.patientid = np.PATIENTID
        INNER JOIN samplestatus AS ss ON ss.billingid = b.billingid
        INNER JOIN test_ascension AS ta ON ta.id = ss.ascensionid
        INNER JOIN test_panels AS tp ON tp.ID = ss.testid
        WHERE ss.approvalstatus = 0 AND ta.collection = 'true' AND ss.resolution IS NULL
  `
  try {
    let result = await promisifyQuery(SQL_QUERY);
    if (result.length > 0 && Array.isArray(result)) {
      result = result.map((item, index) => { return convertKeysToLowerCase(item) })
    }
    response.send({ statusCode: 200, status: 'success', message: 'success', result });
  } catch (err) {
    logger.error(err);
    console.log(err)
    customError('error fetching data', 500, response);
  }
}




const RejectedSampleApproval = async function (request, response) {
  const { action, billingid, manager, message } = request.body;

  const query = `INSERT INTO manager_sample_descision (BILLINGID,ACTION,MESSAGE,MANAGER) VALUES (?,?,?,?)`
  connection.query(query, [billingid, action, message, manager], function (err, result) {
    if (err) {
      response.send({
        status: 'error',
        err
      })
    }
    if (result) {
      response.send({
        status: 'success',
        message: 'updated',
        statusCode: 200
      })
    }
  })
}



const disputeRejection = async function (request, response) {
  const { billingid, testid, disputereason, disputedby, disputedon } = request.body;

  const DISPUTE_QUERY = `UPDATE samplestatus SET disputereason = ?, disputedby = ?, disputedon = ?
   WHERE billingid = ? AND testid = ?`;

  const values = [disputereason, disputedby, disputedon, billingid, testid];

  try {
    const result = await promisifyQuery(DISPUTE_QUERY, values);
    console.log(result)
    if (result?.affectedRows == 1) {
      response.send({ status: 'success', message: 'sample dispute logged successfully', statusCode: 200 })
    } else {
      response.send({ status: 'error', message: 'error logging sample dispute', statusCode: 500 })
    }
  } catch (err) {
    logger.error(err);
    customError('error updating data', 500, response);
  }
}



module.exports = {
  rejectedSample,
  RejectedSampleApproval,
  disputeRejection
}