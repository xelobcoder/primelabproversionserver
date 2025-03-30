const connection = require('../db');
const { customError, promisifyQuery, convertKeysToLowerCase } = require('../../helper');
const logger = require('../../logger');

const testInformation = async function (billingid) {
  try {
    const query = `SELECT price,name FROM test_panels WHERE ID IN (SELECT testid FROM test_ascension WHERE BILLINGID = ?)`;
     return promisifyQuery(query, [billingid]);
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
}


const clientInformation = async function (billingid) {
  try {
    const query =  `SELECT 
    CONCAT(np.FIRSTNAME," ",np.MIDDLENAME," ",np.LASTNAME) AS fullname,
    age,
    agetype,
    billingid,
    date,
    paid_amount,
    discount,
    payable,
    testcost,
    (taxValue+testcost) AS total,
    taxValue,
    mobile_number,
    outstanding,
    gender,
    email,
    dob
    FROM billing AS bb
    INNER JOIN new_patients AS np ON np.PATIENTID = bb.PATIENTID
    WHERE bb.BILLINGID = ?`;
    const result = await promisifyQuery(query, [billingid]);
    return result;
  }
  catch (err) {
    logger.error(err)
  }
}


async function getBillingInvoiceData(billingid, response) {
  // we want to get the personal information of the client
  // and test subscribed to , amount paid and outdtanding bill if any
  if (billingid) {
    let Invoice = {}

    try {
      Invoice.testInformation = await testInformation(billingid);
      Invoice.clientInformation = await clientInformation(billingid)
      const resultset = {
        testInformation: Invoice.testInformation.length > 0 ?
          Invoice.testInformation.map((item, index) => { return convertKeysToLowerCase(item) })
          : [],
        clientInformation: Invoice.clientInformation.length > 0 ? Invoice.clientInformation[0] : {}
      }
      if (response) {
        response.send({
          result: resultset,
        message: 'success',
        statusCode: 200
      })
      } else {
        return resultset
      }
    } catch (err) {
      customError(err?.message || err, 500, response)
    }
  } else {
    customError('billingid required in query', 401, response)
  }
}


module.exports = { getBillingInvoiceData, testInformation,clientInformation }