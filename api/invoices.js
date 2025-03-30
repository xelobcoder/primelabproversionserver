import logger from '../logger';
import connection from './db';
let actions = {
 INVOICE_DATA: async function (idx, response) {
  let patientdetails = {};

  // idx = billing id
  let SQL_QUERY = `SELECT DISTINCT * FROM billing AS t INNER JOIN (SELECT * FROM performing_test) AS p ON t.BILLINGID = p.BILLINGID  INNER JOIN (SELECT * FROM new_patients) AS n ON p.PATIENTID = n.PATIENTID WHERE t.BILLINGID ='${idx}'
  `;
  connection.query(SQL_QUERY, function (err, result) {
   if (err) {
    response.send({ status: 'error' })
    logger.error(err)
   }
   // send data with the company information else respond with none
   if (result.length > 0) {
    patientdetails = result[0];
    company_fxn();
   } else {
    response.send({
     status: 'success',
     message: 'done',
     result
    })
   }
  })


  var company_fxn = function () {
   let SQL_QUERY_2 = `SELECT * FROM companyprofile`;
   connection.query(SQL_QUERY_2, function (err, result) {
    if (err) {
     response.send(err);
    }
    // redefine data 
    let companyprofile = {
     companyname: result[0]['NAME'],
     companyemail: result[0]['EMAIL'],
     companymotto: result[0]['MOTT0'],
     companyphone_number: result[0]['PHONENUMBER'],
     companyAddress: result[0]['ADDRESS']
    }
    patientdetails = { ...patientdetails, ...companyprofile }
    response.send({
     message: 'done',
     status: 'success',
     result: [patientdetails]
    })
   })
  }
 }
}
export default function handler(request, response) {
 let method = request.method;
 switch (method) {
  case 'GET':
   const { action, id, institution } = request.query;
   console.log(action, id, institution)
   if (action == 'INVOICE_DATA') {
    actions.INVOICE_DATA(id, response);
   }
   break;
  default:
   return 'method not recognized'
 }
}