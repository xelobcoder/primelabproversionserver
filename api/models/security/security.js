"use strict"
const { readFile, chmod, rmdir, rm } = require("node:fs/promises")
const jwt = require("jsonwebtoken");
const { promisifyQuery, rowAffected, paginationQuery } = require("../../../helper");
const path = require("node:path");

class Security {
          constructor(employeeid, loginDuration) {
                    this.employeeid = employeeid
                    this.loginDuration = loginDuration || 3;
                    this.sqlConnection = promisifyQuery;
                    this.isMaster = true;
          }

          isEmployeeid() {
                    return this.employeeid != null || this.employeeid != undefined;
          }
          async createSessionId() {
                    return jwt.sign(this.employeeid, process.env.ACCESS_TOKEN_SECRET);
          }

          validDurationProvided() {
                    return this.loginDuration && this.loginDuration > 0 && this.loginDuration <= 6;
          }

          async insertLoginHistory(browserInformation) {
                    const expirtyTime = Date.now() + this.loginDuration * 60 * 60 * 1000;
                    if (!this.employeeid) {
                              throw new Error("employeeid not provided");
                    }
                    if (!this.validDurationProvided()) {
                              throw new Error('login Duration must be between 7 && 0');
                    }
                    let sessionid = await this.createSessionId();
                    const query = `INSERT INTO loginlogs (employeeid,loginSessionId,logoutTime,browserInformation) 
                    VALUES(?,?,?,?)`;
                    const values = [this.employeeid, sessionid, expirtyTime, JSON.stringify(browserInformation)];
                    await this.sqlConnection(query, values);
                    return expirtyTime;
          }

          currentTimeInMillessconds = () => { return Date.now() }

          async getCurrentLoginCounts() {
                    const query = `SELECT COUNT(*) AS count FROM loginlogs WHERE logoutTime > ?`;
                    const result = await this.sqlConnection(query, this.currentTimeInMillessconds());
                    return result.length > 0 ? result[0]['count'] : 0
          }

          async getCurrentUserLoginSessions() {
                    if (this.isEmployeeid()) {
                              const sessionQuery = `SELECT * FROM sessionTracker WHERE logoutTime > ? AND employeeid = ?`;
                              const data = await this.sqlConnection(sessionQuery, [this.currentTimeInMillessconds(), this.employeeid]);
                              return data;
                    }
                    return 0
          }

          async getCurrentUserLoginSessionsWithDetails() {
                    if (this.isEmployeeid()) {
                              const sessionQuery = `SELECT * FROM sessionTracker AS st
                              INNER JOIN loginLogs AS ll ON ll.employeeid = st.employeeid WHERE st.logoutTime > ? AND st.employeeid = ? AND ll.loggedout = 0`
                              let data = await this.sqlConnection(sessionQuery, [this.currentTimeInMillessconds(), this.employeeid]);
                              if (data.length > 0) {
                                        return data = data.map((item, index) => {
                                                  if (item.hasOwnProperty("browserInformation")) {
                                                            item['browserInformation'] = JSON.parse(item['browserInformation']);
                                                  }
                                                  return item
                                        })
                              }
                    }
                    return [];
          }

          async getCanInitiateLogin() {
                    const data = await this.getCurrentUserLoginSessions();
                    if (Array.isArray(data)) return data.length == 0;
          }

          async destroyUserSessions() {
                    let sessionsKeys = [];
                    try {
                              const query = `SELECT * FROM sessionTracker WHERE employeeid = ?`;
                              let result = await this.sqlConnection(query, this.employeeid);
                              if (result.length > 0) {
                                        result = result.map((item, index) => sessionsKeys.push(item?.loginhxid));
                                        await this.sqlConnection(`DELETE FROM sessionTracker WHERE employeeid = ?`, [this.employeeid]);
                              }

                    } catch (err) {
                              console.log(err)
                    } finally {
                              if (sessionsKeys.length > 0) {
                                        sessionsKeys.map(async (item, index) => {
                                                  const query = `UPDATE loginlogs SET loggedout = 1,actualLogout = ? WHERE keyid = ?`;
                                                  const updated = await this.sqlConnection(query, [Date.now(),item])
                                                  return rowAffected(updated)
                                        })
                                        let status = (await Promise.all(sessionsKeys))
                                                  .some((a, i) => a == false);

                                        return status ? false : true;
                              }
                    }
          }
          async getEmployeeLoginHistory(page = 1, count = 10) {
                    if (!this.isEmployeeid()) return;
                    const query = `SELECT * FROM loginlogs WHERE employeeid = ? OFFFSET ? LIMIT ?`;
                    return await paginationQuery({ page, count }, query), [parseInt(this.employeeid)];
          }


          async getEmployeeLastLoginSession() {
                    if (!this.isEmployeeid()) return;
                    const query = `SELECT * FROM loginlogs WHERE employeeid = ? ORDER BY id DESC`;
                    return await promisifyQuery(query, [this.employeeid])
          }


          async getGeneralLoginHistory(page = 1, count = 10, employeeid = null) {
                    let queryValues = [];
                    let query = `SELECT 
                    ll.browserInformation,
                    ll.employeeid,
                    rl.username,
                    ll.logoutTime,
                    ll.actualLogout,
                    ll.loggedout,
                    ll.loginTime
                    FROM loginlogs AS  ll
                    INNER JOIN roles AS rl
                    ON rl.employeeid = ll.employeeid`;

                    if (employeeid && !isNaN(employeeid)) {
                              query += ` WHERE rl.employeeid = ?`;
                              queryValues.push(employeeid);
                    }
                    query += ` ORDER BY keyid DESC LIMIT  ? OFFSET  ? `;
                    return await paginationQuery({ page, count }, query, queryValues);
          }

          async getDboSystemSecurity() {
                    return await this.sqlConnection('SELECT * FROM `dbo.systemsecurity`');
          }

          async environmentSecurity(currentAppPath) {
                    try {
                              if (typeof currentAppPath != "string") {
                                        throw new TypeError("path must be a string");
                              }
                              const appPath = path.join(__dirname, '../../../app.js');
                              const appModels = path.join(__dirname, "../../models");
                              const appControllers = path.join(__dirname, "../../controllers");
                              const REGISTERED_ENV = await this.getDboSystemSecurity();
                              if (REGISTERED_ENV.length == 0) {
                                        throw new Error('Device not recognized or licenced to run this software');
                              };
                              const currentComputer = process.env.COMPUTERNAME;
                              const currentDomain = process.env.USERDOMAIN;
                              const currentSystemRoot = process.env.SYSTEMROOT;

                              const registeredComputer = REGISTERED_ENV[0]['computerName'];
                              const registeredUser = REGISTERED_ENV[0]['userDomain'];
                              const registeredSystemRoot = REGISTERED_ENV[0]['systemRoot'];
                              const registeredDirectory = REGISTERED_ENV[0]['appDir'];

                              if (registeredComputer != currentComputer ||
                                        registeredSystemRoot != currentSystemRoot ||
                                        registeredUser != currentDomain || currentAppPath != registeredDirectory) {
                                        return false
                              } else {
                                        return true;
                                        // to be implemented delete resoiurce from computer if the software is runned on unauthorized device. This is for the security of the software. 
                                        // appPath, appModels and appControllers are deleted.
                                        
                              }


                    }
                    catch (err) {
                              if (err.code == 'ENOENT') {
                                        console.log('no such folder')
                              }
                    }
          }

}


module.exports = Security
