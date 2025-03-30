const { promisifyQuery, customError } = require("../../../helper");
const logger = require("../../../logger");
class Manager {
  constructor(employeeid, billingid, testid) {
    this.employeeid = employeeid;
    this.billingid = billingid;
    this.testid = testid;
  }

  getManagerApprovals = (duration) => {
    let defaultDuration = "daily";
  };

  async verificationManager() {
    // we will check if manager exist in table in the database
    // if true , we continue else we return A 401 error 
      const sqlQuery = `SELECT * FROM roles WHERE employeeid = ? `;
      const result = await promisifyQuery(sqlQuery, [this.employeeid]);
      return result.length > 0 && result[0]["role"].toLowerCase() === "manager";
  }

  insertApproval = async (approvalStatus, message = null) => {
      try {
          let insertNewResult = `
            UPDATE test_ascension SET ApprovalStatus = ?,
    ApprovedBy = ? `;

          if (approvalStatus == false) {
              insertNewResult += `,DeclineMessage = '${message}' `
          }
          insertNewResult += `WHERE billingid = ? AND testid = ? `
          const values = [approvalStatus, this.employeeid, this.billingid, this.testid];

          return await promisifyQuery(insertNewResult, values);
      } catch (err) {
          logger.error(err?.message || message);
          throw new Error(err);
      }
  };

  getReadyForApprovals = async function (request, response) {
    const query = ` 
        SELECT ta.testid,
              ta.billingid,
              bb.clientstatus AS urgency,
              tt.name,
              ta.declineMessage,
              ta.approvedby,
              ta.approvalstatus,
              ta.actionPlan,
              bb.patientid,
              dp.department,
        CASE WHEN np.middlename IS NULL THEN CONCAT(np.firstname," ", np.lastname) 
            WHEN np.middlename IS NOT NULL THEN CONCAT(np.firstname, " ", np.middlename, " ", np.lastname) 
            END AS fullname
        FROM test_ascension AS ta
            INNER JOIN billing as bb ON bb.billingid = ta.billingid
            INNER JOIN new_patients AS np ON np.patientid = bb.patientid
            INNER JOIN test_panels AS tt ON tt.ID = ta.testid
            INNER JOIN departments AS dp ON dp.id = tt.category
        WHERE ta.ready = 'true'
        AND ta.ApprovalStatus = 0 and declineMessage is null
    `
    try {
      let result = await promisifyQuery(query);
      if (result.length > 0) {
        result = result.sort((a, b) => a.urgency - b.urgency);
        response.send(result);
      }
      response.send(result);
    } catch (err) {
      logger.error(err.message);
      customError(err?.message, 500, response);
    }
  }

}




module.exports = Manager;