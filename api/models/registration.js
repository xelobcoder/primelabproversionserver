const { customError, promisifyQuery, rowAffected } = require("../../helper")
const logger = require("../../logger")
const database_queries = require("../database/queries");
const { changeActivationStatus } = require("../../dist/models/activation/activate");

/**
 * The `Registration` class is responsible for handling the registration of new patients in a healthcare system.
 * It provides methods for checking if bulk registration is enabled, generating a unique patient ID, checking if a patient ID already exists,
 * checking if an email or mobile number already exists, adding personal information of a patient, adding addressing information of a patient,
 * adding emergency contact information of a patient, and updating personal information of a patient.
 *
 * @class Registration
 */
class Registration {
  constructor(patientid) {
    this.patientid = patientid
  }

  async getPatientBasicData() {
    if (typeof this.patientid != "number") throw new TypeError("Type number required");
    return await promisifyQuery(`SELECT * FROM new_patients WHERE patientid = ?`, [this.patientid]);
  }

  isBulkRegistration = async function () {
    try {
      const query = `SELECT bulkregistration FROM applicationsettings`
      const result = await promisifyQuery(query)
      if (result.length === 0) return false
      const { bulkregistration } = result[0]
      return bulkregistration === 1
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  temporaryOrder = async (records) => {
    const { clinicianid, data, patientid } = records
    if (!clinicianid || !data) return "please add clinicianid and data"
    try {
      const isRequestedToday = await promisifyQuery(
        `SELECT * FROM billingtemporarytable WHERE clinicianid = ? AND patientid = ? AND DATE(created_on) = CURRENT_DATE `,
        [clinicianid, patientid]
      )

      if (typeof data == "object" && data.length > 0 && isRequestedToday.length == 0) {
        const transformedData = JSON.stringify(data)
        const query = `INSERT INTO billingtemporarytable (clinicianid,data,patientid) VALUES (?,?,?)`
        const values = [clinicianid, transformedData, patientid]
        const result = await promisifyQuery(query, values)
        return result.affectedRows == 1 ? true : false
      }
      return false
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  getTemporaryOrders = async (target, clinicianid, date) => {
    if (!target) return new Error("target for query not provided")

    const values = []
    try {
      let query = `SELECT * FROM billingtemporarytable  AS bt
      INNER JOIN new_patients  AS np ON np.patientid = bt.patientid`

      if (target == "clinician") {
        query += ` WHERE bt.clinicianid = ? AND bt.processed = 0`
        values.push(clinicianid)
      } else {
        query += ` WHERE bt.processed = 0`
      }

      if (date) {
        query += ` AND DATE(bt.created_on) = ?`
        values.push(date)
      }
      query += ` ORDER BY bt.orderid DESC LIMIT 20`

      const result = await promisifyQuery(query, values)

      return result
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }

  getTemporaryOrdersProcessing = async (id) => {
    try {
      let getorder = await database_queries.getsingleid(id, "billingtemporarytable", "orderid")
      if (getorder.length == 0) return []
      const { clinicianid, organizationid, data, patientid, orderid } = getorder[0]
      let _this = {}
      _this.tax = []
      _this.patientid = patientid
      _this.orderid = orderid
      _this.clinician = clinicianid
      _this.organization = organizationid
      _this.taxValue = 0
      _this.taxRate = 0
      _this.taxIncluded = false
      _this.paid = 0
      _this.cost = 0
      _this.samplingCenter = null
      const transformeddata = JSON.parse(data) || []
      _this.test = transformeddata || []
      _this.testcost = 0

      if (transformeddata.length > 0) {
        _this.test = transformeddata.filter((item, index) => {
          return item.name !== "" && item.price !== 0
        })
        // total test cost exclusive of tax
        const { test } = _this
        _this.testcost = test.reduce((a, b, index) => {
          return a + b.price
        }, 0)
      }
      // get taxes
      const getTax = await promisifyQuery(`SELECT * FROM tax WHERE apply = 'Yes'`)

      if (getTax.length > 0) {
        _this.tax = getTax
        _this.taxRate = getTax.reduce((a, b, index) => {
          return a + b.value
        }, 0)
        _this.taxValue = parseFloat(_this.testcost * (_this.taxRate / 100))
        _this.taxIncluded = true
      }
      _this.cost = _this.taxValue + _this.testcost
      _this.payable = _this.total
      _this.paymentmode = ""
      let cliniciandata = await database_queries.getsingleid(parseInt(clinicianid), "clinicianbasicinfo", "id")

      if (cliniciandata.length > 0) {
        _this.clinicianname = cliniciandata[0]["name"]
      }
      delete _this.data
      return _this
    } catch (err) {
      logger.error(err)
      throw new Error(err)
    }
  }
  getLastID = async function () {
    return await promisifyQuery(`SELECT id FROM new_patients ORDER BY id DESC LIMIT 1`)
  }

  generatePatientId = () => {
    return Date.now()
  }

  updateProcessedOrder = async function (orderid) {
    try {
      if (!orderid) {
        throw new Error("orderid required")
      }
      const result = await promisifyQuery(`UPDATE billingtemporarytable SET processed = 1 WHERE orderid = ?`, [orderid])
      return rowAffected(result);
    } catch (err) {
      throw new Error(err)
    }
  }

  checkPatientIdExist = async (patientid) => {
    try {
      let useKey;
      useKey = patientid ? patientid : this.patientid
      let result = await promisifyQuery(`SELECT * FROM new_patients WHERE PATIENTID = ?`, useKey)
      return result.length > 0 ? true : false
    } catch (err) {
      logger.error(err)
      return false
    }
  }

  checkEmailOrMobileExist = async (email, mobile) => {
    if (email || mobile) {
      try {
        const result = await promisifyQuery(`SELECT * FROM new_patients WHERE EMAIL = ? OR MOBILE_NUMBER = ?`, [email, parseInt(mobile)])
        return result.length > 0 ? true : false
      } catch (err) {
        logger.error(err)
        return false
      }
    }
  }

  isClientSame = async (clientdata) => {
    try {
      const { mobile, mobileownership, email } = clientdata;
      const verifyOwnerShip = (result) => {
        if (result.length > 0) {
          if (mobileownership == 'relative') {
            return false
          } else {
            return true
          }
        } else {
          return false;
        }
      }
      if (mobile && mobile.toString().length > 0) {
        const result = await promisifyQuery(`SELECT mobile_number AS mobile FROM new_patients WHERE mobile_number = ?`, [parseInt(mobile)]);
        return verifyOwnerShip(result);
      }

      if (email && email.toString().length > 0 && email.includes("@")) {
        const result = promisifyQuery(`SELECT email FROM new_patients WHERE email = ?`, [email]);
        return verifyOwnerShip(result);
      }
    } catch (err) {
      logger.error(err)
    }
  }

  personalInformation = async (records) => {
    try {
      const {
        firstname,
        lastname,
        middlename,
        age,
        ageType,
        gender,
        email,
        mobile,
        days,
        months,
        maritalstatus,
        occupation,
        patientOrganization,
        years,
        mobileownership = "self",
      } = records
      const query = `INSERT INTO new_patients (firstname, lastname, middlename, email, age, agetype, dob, marital_status, mobile_number, occupation, gender, organization, contactpointer)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const values = [
        firstname,
        lastname,
        middlename,
        email,
        age,
        ageType,
        `${years}-${months}-${days}`,
        maritalstatus,
        mobile,
        occupation,
        gender,
        patientOrganization,
        mobileownership,
      ]
      // execute query
      const result = await promisifyQuery(query, values)
      return { count: result.affectedRows, insertid: result.insertId }
    } catch (err) {
      logger.error(err)
    }
  }

  addressingInformation = async (id, records) => {
    try {
      const { area, region, gpsLocation, address } = records
      const query = `UPDATE patientsaddress SET area = ?,region = ?,gpsLocation = ?,address = ? WHERE patientid = ?`
      const values = [area, region, gpsLocation, address, id]
      const result = rowAffected(await promisifyQuery(query, values))
      return result
    } catch (err) {
      throw new Error(err?.message || err)
    }
  }

  emmergencyInformation = async (id, records) => {
    try {
      const { emmergencyContactName, emmergencyContactNumber, relationship,  address, occupation } = records
      //  update the record of the addressing information table using the result query
      const query = `UPDATE patientemmergencycontactinformation SET emmergencyContactName = ?,emmergencyContactNumber = ?, relationship = ?,occupation = ?, address = ? WHERE patientid = ?`
      // execute the query
      const values = [emmergencyContactName, emmergencyContactNumber, relationship, occupation, address, id]
      // execute the query
      return rowAffected(await promisifyQuery(query, values))
    } catch (err) {
      throw new Error(err)
    }
  }

  async getPatientID(insertId) {
    if (typeof insertId != "number") {
      throw new TypeError("number required as insertedId")
    }
    const packet = await promisifyQuery(`SELECT patientid FROM new_patients where id = ?`, [insertId]);
    return packet.length > 0 ? packet[0]['patientid'] : null;
  }

  addNewPatient = async (request, response) => {
    const { data } = request.body
    // destructure information from the personal information provided
    // we will push the data into the new patient table in the database
    // if successuly registered, a mail is sent to the client to authenticate email, if only is email is present
    try {
      const isAlreadyRegistered = await this.isClientSame(data);
      // // if false we insert into the database table
      if (isAlreadyRegistered) {
        response.send({
          status: "warning",
          message:
            data?.mobileownership == "relative"
              ? "Number or emaill associated with a patientid.Please search and bill client to continue"
              : "Number or email is a associated with  a different patient. Select relative if person is a relative",
          statusCode: 404,
        })
        return
      }
      const { insertid } = await this.personalInformation(data);

      if (!insertid) {
        throw new Error("Failure to retrieve patientid");
      }
      const patientid = await this.getPatientID(parseInt(insertid));
      // activating patient for services 
      changeActivationStatus({ patientid, action: "TRUE", isbulk: false });

      return patientid;

    } catch (error) {
      console.log(error)
      response.send({
        status: "error",
        message: "An error occured while trying to add new patient",
        statusCode: 500,
        error: error,
      })
    }
  }

  UpdatePersonalInformation = async (request, response) => {
    if (await this.checkPatientIdExist()) {
      const {
        firstname,
        lastname,
        middlename,
        age,
        ageType,
        gender,
        email,
        mobile,
        days,
        months,
        maritalstatus,
        occupation,
        patientOrganization,
        years,
      } = request.body.data

      const query = `UPDATE new_patients 
                   SET firstname = ?, lastname = ?, middlename = ?, email = ?,age = ?, agetype = ?, dob = ?, marital_status = ?, mobile_number = ?, occupation = ?, gender = ?, organization = ?
                   WHERE patientid = ?`

      // query values
      const values = [
        firstname,
        lastname,
        middlename,
        email,
        age,
        ageType,
        `${years}-${months}-${days}`,
        maritalstatus,
        mobile,
        occupation,
        gender,
        patientOrganization,
        this.patientid,
      ]

      const result = await promisifyQuery(query, values)
      if (rowAffected(result)) {
        response.send({ statusCode: 200, message: "record updated sucessfully", status: "success" })
      } else {
        response.send({ statusCode: 404, message: "record update failed", status: "error" })
      }
    } else {
      customError(`patient id not found`, 404, response)
    }
  }

  async getPatientInfoUsingBillingId(billingid) {
    if (!isNaN(billingid)) {
      const query = `SELECT * FROM new_patients AS np INNER JOIN billing AS b ON b.patientid = np.patientid  WHERE b.billingid = ?`
      const result = await promisifyQuery(query, [parseInt(billingid)])
      return result
    }
  }

  async filterPatientUsingClient(input) {
    try {
      //  filter based on the provided input, it could fullname or patientid or mobile number or email
      // we concat db fullname,lastname and middlename to get fullname
      const query = `SELECT DISTINCT * FROM new_patients WHERE CONCAT(firstname,' ',lastname,' ',middlename) LIKE ? OR patientid LIKE ? OR mobile_number LIKE ? OR email LIKE ?`
      const values = [`%${input}%`, `%${input}%`, `%${input}%`, `%${input}%}`]
      const result = await promisifyQuery(query, values)
      return result
    } catch (error) {
      logger.error(error)
      return false
    }
  }

  async getRegisteredClientsCount() {
    let count = await promisifyQuery(`SELECT COUNT(*) AS count FROM new_patients`);
    if (count.length > 0) return count[0]['count'];
    return 0;
  }

  async getTodayRegistedClientCount() {
    let count = await promisifyQuery(`SELECT COUNT(*) AS count FROM new_patients WHERE DATE(date) = CURRENT_DATE`);
    if (count.length > 0) return count[0]['count'];
    return 0;
  }

  async getRegisteredClientsPerMonth() {
    try {
      let range = 12;
      let current = 0;
      let months = {};
      while (current <= range) {
        let getMonthCount = await promisifyQuery(`SELECT COUNT(*) AS count  FROM new_patients WHERE MONTH(date) = ?`, [current]);
        months[current] = getMonthCount[0];
        current++;
      }
      return months;
    } catch (err) {
      logger.error(err);
      return 0;
    }
  }
}



module.exports = Registration
