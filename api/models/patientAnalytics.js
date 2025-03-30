const { customError, promisifyQuery, convertKeysToLowerCase, getFullBloodCountTrend } = require("../../helper");
const logger = require("../../logger");
const bcrypt = require('bcrypt')
const connectionpool = require("../dbpool");
const database_queries = require('../database/queries')
const User = require('../LobnosAuth/user');
const Registration = require('../models/registration');
const testpanel = require("../testpanel/list");


class Patient extends Registration {
  constructor(patientid) {
    super(patientid);
  }

  runqueryPromise = async function (query, values) {
    return new Promise((resolve, reject) => {
      connectionpool.query(query, values, function (err, result) {
        if (err) { reject(err) }
        else { resolve(result) }
      })
    })
  }

  getCustomersRecords() {

  }


  getTransactionsByDate = async function (patientid, to, from) {
    const isArgGiven = arguments.length > 0 && typeof arguments[0] == 'number' ? patientid : this.patientid;
    if (await this.checkPatientIdExist()) {
      let query = `SELECT DATE(billedon)  AS TransactionsDate,BILLINGID AS TransactionId FROM billing
      WHERE PATIENTID = ? ORDER BY billedon DESC `
      let values = [isArgGiven]
      if (from && to) {
        query += `AND DATE BETWEEN ? AND ?`
        values = [...values, from, to]
      }
      // return a promise
      return this.runqueryPromise(query, values)
    } else {
      return `patientid ${isArgGiven} not found`
    }
  }

  updateCredentials = async function (request, response) {
    const { opassword, npassword, nppassword, username } = request.body;
    let oldpassworldMatched = null;
    const isValid = await this.checkPatientIdExist(username);
    const matched = nppassword === nppassword;
    const db_old_password = await database_queries.getsingleid(username, 'patients_credentials', 'patientid');

    if (Array.isArray(db_old_password) && db_old_password.length > 0) {
      const { username, password, updated } = db_old_password[0];
      if (updated == 'true') {
        const compare = await bcrypt.compare(opassword, password);
        oldpassworldMatched = compare;
      } else {
        oldpassworldMatched = opassword === password;
      }
    }

    if (!isValid) {
      customError('Invalid membership id or username', 404, response);
      return;
    }
    if (!matched) {
      customError('new password match error', 404, response);
      return;
    }

    if (!oldpassworldMatched) { customError(`invalid old password credentials`, 404, response) };

    if (isValid && matched && oldpassworldMatched) {
      const hashedPassword = await new User(username, npassword).hashPassword()
      const updateQuery = `UPDATE patients_credentials SET password = ?,  updated = 'true' WHERE PATIENTID = ?`;
      try {
        const result = await this.runqueryPromise(updateQuery, [hashedPassword, username]);
        if (result && result.affectedRows == 1) {
          response.send({ status: 'success', statusCode: 200, message: 'patient credentials updated successfully' })
        }
      } catch (err) {
        logger.error(err)
        customError(err.message, 500, response)
      }
    }
  }

  updateNotificationSettings = async function (request, response) {
    const { mode, method, notify, patientid } = request.body;

    if (mode && method && notify && patientid) {
      const updateQuery = `UPDATE patients_settings SET mode = ?, method = ? , notify = ? WHERE patientid = ?`;
      const updated = await this.runqueryPromise(updateQuery, [mode, method, notify, parseInt(patientid)]);
      if (updated && updated.affectedRows == 1) {
        response.send({ status: 'success', statusCode: 200, message: 'patient settings updated successfully' })
      }
    } else {
      customError(`mode of result,method of delivery and notification settings required`, 404, response)
    }
  }


  async transformDataset(list, data) {
    return list.map((item, index) => {
      const filtered = data.filter((e, i) => { if (e.billingid == parseInt(item)) { return convertKeysToLowerCase(e) } });
      return { billingid: item, data: filtered, date: filtered.length > 0 ? filtered[0]['created_on'] : null }
    }).sort((a, b) => { return new Date(a.date) - new Date(b.date) });
  }


  async getParameters(data) {
    let parameters = [];
    data.map((item, index) => {
      if (!parameters.includes(item?.parameter))
      { parameters.push(item?.parameter) }
    })
    return parameters;
  }


  async getPatientBillingRecords(details) {
    const { patientid, count = 10, page = 1, startdate, enddate } = details
    if (!patientid || isNaN(patientid)) throw new Error("patientid required");

    let query, values = [];

    if (startdate && enddate) {
      const startYear = new Date(startdate).getFullYear();
      const endYear = new Date(enddate).getFullYear();
      const stMonth = new Date(startdate).getMonth();
      const edMonth = new Date(enddate).getMonth();
      let partitions = await this.billingPartitionPrunner(startdate, enddate);
      query = `SELECT * FROM billing PARTITION(${partitions}) WHERE patientid = ? AND year BETWEEN ? AND ? LIMIT ? OFFSET ?`;
      values = [patientid, startYear, endYear, count, (page - 1) * count];
    } else if (startdate) {
      const startYear = new Date(startdate).getFullYear();
      query = `SELECT * FROM billing WHERE patientid = ? AND year >= ? LIMIT ? OFFSET ?`;
      values = [patientid, startYear, count, (page - 1) * count];
    } else {
      query = `SELECT * FROM billing WHERE patientid = ? LIMIT ? OFFSET ?`;
      values = [patientid, count, (page - 1) * count];
    }
    const result = await promisifyQuery(query, values);
// console.log(result)
    return result;
  }



  async getPatientFullBloodCountTrend(listArray) {
    const trendDataSet = await getFullBloodCountTrend(this.patientid);

    const transformed = await this.transformDataset(listArray, trendDataSet);

    const parameters = await this.getParameters(trendDataSet);

    return { trend: transformed, category: 'fbc', supported: true, parameters }
  }

  getPatientTestTrend = async function (patientid, testid, testname, instances) {
    if (!patientid) {
      throw new Error('patientid required');
    }
    if (!testid) {
      throw new Error('testid required');
    }
    if (!testname) {
      throw new Error('testname required');
    }
    if (!instances) {
      throw new Error('instances required');
    }
    const hasTrendActivated = await testpanel.hasTrend(testid);
    
    if (!hasTrendActivated) return `test trend not setup/activated for this test in test creation`;

    const tableName = 'result' + testpanel.generateTableName(testname);
    if (!tableName) throw new Error('tableName not found');
    let instancesSearch = '';

    if (instances) {
      instancesSearch = await promisifyQuery(`SELECT DISTINCT billingid FROM ${tableName} WHERE patientid = ? LIMIT ?`, [parseInt(patientid), parseInt(instances)]);
      if (instancesSearch.length != 0) {
        instancesSearch = instancesSearch.map((a, index) => a.billingid).join(",");
      }
    }
    const query = `SELECT field, value,billingid,created_on AS date FROM ${tableName}  WHERE billingid IN (${instancesSearch}) ORDER BY id DESC`;

    let result = await promisifyQuery(query);

    if (result.length != 0) {
      let fields = [];
      result.map((item, index) => { !fields.includes(item.field) && fields.push(item.field)});
      if (fields.length != 0) {
        const categorized = fields.map((a, index) => {
          const resultInstances = result.filter((item, index) => { return item.field == a }).sort((a, b) => a.billingid - b.billingid);
          return { field: a, data: resultInstances };
        });
        return categorized;
      }
    }
    return result;
  }
}



module.exports = Patient;

