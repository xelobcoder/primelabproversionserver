const logger = require('../logger')
const connection = require('./db')
const { promisifyQuery, paginationQuery } = require("./../helper")
const SUCCESSMESSAGE = 'SUCCESS'
const ERRORMESSAGE = 'FAILED'
const ADD_PATIENT_QUERY = `INSERT INTO new_patients (
    firstname,
    lastname,
    middlename,
    area,
    region,
    address,
    email,
    patientid,
    age,
    agetype,
    marital_status,
    relationship,
    emmergency_contact_name,
    emmergency_contact,
    gender,
    dob,
    mobile_number,
    occupation,
    patientorganization
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;


// Step: 1 - check if patient is already registered as a patient
// Step: 2 - if not registered, add patient to database
//  progress
// 1. return message to go to billing page
// 2. client is automatically activated to start billing
// 3. client is added to operational list
// 4. test is listed in performing test table with id linked to operational list
// Step: 3 - if registered, return error message of patient already registered
// Step: 4 - if patient is added, return success message
// step: 5

// step 1

// this function checks for the present of the patient in the database
/**
 *
 * @param {Number} patientid patientid
 * @returns {promise} promise returns a promise of true,false or error
 */
var checkpatient = async function (patientid) {
  try {
    const CHECK_PATIENT_QUERY = `SELECT * FROM new_patients WHERE PATIENTID = ?`
    const result = await promisifyQuery(CHECK_PATIENT_QUERY, patientid)
    return result.length > 0 ? true : false
  } catch (err) {
    logger.error(err)
  }
}

// step 2

var addpatient = function (request, response) {
  const {
    firstname,
    lastname,
    middlename,
    email,
    patientid,
    age,
    ageType,
    maritalstatus,
    relationship,
    emmergencyName,
    emmergencyContactNumber,
    mobile,
    gender,
    days,
    months,
    area,
    region,
    address,
    years,
    occupation,
    patientOrganization,
  } = request.body



  var dob = new Date(parseInt(years), parseInt(months - 1), parseInt(days))

  const data = [
    firstname,
    lastname,
    middlename,
    area,
    region,
    address,
    email,
    patientid,
    age,
    ageType,
    maritalstatus,
    relationship,
    emmergencyName,
    emmergencyContactNumber,
    gender,
    dob,
    mobile,
    occupation,
    patientOrganization,
  ]

  checkpatient(request.body?.patientid)
    .then((result) => {
      if (result) {
        response.send({
          status: ERRORMESSAGE,
          message: 'Patient already registered',
          patientid,
          statusCode: 401
        })
      }

      if (!result) {
        connection.query(ADD_PATIENT_QUERY, data, (err, result) => {
          if (err) logger.error(err)
          response.send({
            status: SUCCESSMESSAGE,
            message: 'Patient successfully registered',
            patientid,
            statusCode: 200
          })
        })
      }
    })
    .catch((err) => {
      logger.error(err)
    })
}

const newgetpatient = async function (request, response) {
  const {
    patientid,
    fullname,
    phonenumber,
    filter,
    count, page,
    from = new Date(),
    to = new Date(),
  } = request.query;

  let sql = 'SELECT * FROM new_patients';
  const conditions = [];
  const values = [];

  if (patientid) {
    conditions.push('patientid = ?');
    values.push(patientid);
  }
  if (fullname) {
    conditions.push('CONCAT(firstname, " ", middlename, " ", lastname) LIKE ?');
    values.push(`%${fullname}%`);
  }
  if (phonenumber) {
    conditions.push('mobile_number = ?');
    values.push(phonenumber);
  }
  if (filter) {
    conditions.push('(CONCAT(firstname, " ", middlename, " ", lastname) LIKE ? OR patientid LIKE ?)');
    values.push(`%${filter}%`, `%${filter}%`);
    if (request.query.hasOwnProperty('from') && request.query.hasOwnProperty('to')) {
      conditions.push('date BETWEEN ? AND ?');
      values.push(date_from, date_to);
    }
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  } else {
    sql += ' LIMIT ? OFFSET ?';
    values.push(count, page);
  }

  try {
    const result = await paginationQuery({ page, count }, sql, values);
    response.send(result);
  } catch (err) {
    logger.error(err);
    response.status(500).send('Internal Server Error');
  }
};

const getpatient = function (request, response) {
  const queryLength = Object.keys(request.query).length;
  const isPatientid = Object.keys(request.query).includes('patientid');
  const isFilter = Object.keys(request.query).includes('filter');
  const isFullname = Object.keys(request.query).includes('fullname');
  const isPhoneNumber = Object.keys(request.query).includes('phonenumber');
  const isdateIncluded = Object.keys(request.query).includes('date_from')
  // if request query is greater than 0
  if (queryLength > 0) {
    if (isPatientid) {
      connection.query(
        'SELECT * FROM new_patients WHERE PATIENTID = ?',
        [request.query.patientid],
        (err, result) => {
          if (err) { logger.error(err) }
          response.send(result)
        },
      )
    }


    if (isFullname) {
      connection.query(`SELECT * FROM new_patients WHERE FIRSTNAME LIKE ? `,
        [request.query.fullname],
        (err, result) => {
          if (err) { logger.error(err) };
          response.send(result)
        })
    }


    if (isPhoneNumber) {
      connection.query(`SELECT * FROM new_patients WHERE MOBILE_NUMBER = ?`,
        [request.query.phonenumber],
        (err, result) => {
          if (err) { logger.error(err) };
          response.send(result)
        })
    }

    if (
      isFilter & !isdateIncluded
    ) {
      const { filter } = request.query
      //  Filter fullname or patient id
      connection.query(
        'SELECT * FROM NEW_PATIENTS WHERE FULLNAME LIKE ? OR PATIENTID LIKE ?',
        ['%' + filter + '%', '%' + filter + '%'],
        (err, result) => {
          if (err) {
            logger.error(err)
          }
          response.send(result)
        },
      )
    }
    // if contains filter value , date from and date to

    if (
      isFilter && isdateIncluded
    ) {
      const { filter } = request.query
      const { date_from } = request.query || new Date()
      const { date_to } = request.query || new Date()
      connection.query(
        'SELECT * FROM NEW_PATIENTS WHERE FULLNAME LIKE ? OR PATIENTID LIKE ? AND DATE BETWEEN ? AND ?',
        ['%' + filter + '%', '%' + filter + '%', date_from, date_to],
        (err, result) => {
          if (err) {
            logger.error(err)
          }
          response.send(result)
        }
      )
    }
  } else {
    // send all first 500 patients
    connection.query('SELECT * FROM NEW_PATIENTS LIMIT 1000', (err, result) => {
      if (err) {
        logger.error(err)
      }
      response.send(result)
    })
  }
}


const putpatient = async function (request, response) {
  const {
    firstname,
    lastname,
    middlename,
    email,
    patientid,
    age,
    ageType,
    maritalstatus,
    relationship,
    emmergencyName,
    emmergencyContactNumber,
    mobile,
    gender,
    days,
    months,
    area,
    region,
    address,
    years,
    occupation,
    patientOrganization,
  } = request.body




  const data = [
    firstname,
    lastname,
    middlename,
    area,
    region,
    address,
    email,
    age,
    ageType,
    maritalstatus,
    relationship,
    emmergencyName,
    emmergencyContactNumber,
    gender,
    mobile,
    occupation,
    patientOrganization,
    patientid,
  ]



  //  we gonna update the patient
  // first we check if the patient exist
  const patientExist = await checkpatient(request.body?.patientid)
  if (patientExist) {
    // update query beloe
    const mysqlQuery = `UPDATE new_patients SET 
                  firstname = ?, 
                  lastname = ?, 
                  middlename = ?, 
                  area = ?, 
                  region = ?, 
                  address = ?, 
                  email = ?, 
                  age = ?, 
                  agetype = ?, 
                  marital_status = ?, 
                  relationship = ?, 
                  emmergency_contact_name = ?, 
                  emmergency_contact = ?, 
                  gender = ?, 
                  mobile_number = ?, 
                  occupation = ?, 
                  patientorganization = ? 
                  WHERE patientid = ?`;



    // execute the query

    connection.query(mysqlQuery, data, (err, result) => {
      console.log(err)
      if (err) {
        response.send({
          status: ERRORMESSAGE,
          message: 'Patient update failed',
          patientid,
          statusCode: 401
        })
      }
      else {
        response.send({
          status: SUCCESSMESSAGE,
          message: 'Patient successfully updated',
          patientid,
          statusCode: 200
        })
      }
    })

  } else {
    response.send({
      status: ERRORMESSAGE,
      message: 'Patient does not exist',
      patientid,
      statusCode: 401
    })
  }

}


module.exports = {
  addpatient,
  getpatient,
  putpatient,
  checkpatient
}