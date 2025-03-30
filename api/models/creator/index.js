const { promisifyQuery, rowAffected,customError } = require("../../../helper");
const testpanel = require("../../testpanel/list");
const Registration = require("../../models/registration");
const CustomTest = require("../resultentry/customTestEntry");
const Operations = require("../operations");
class Creator {
  constructor(testid) {
    this.testid = testid;
  }

  async getTestCreationRule() {
    if (!this.testid) throw new Error("testid is required");
    const query = "SELECT creationrule FROM customtestcreation WHERE testid = ?"
    const rule = await promisifyQuery(query, [this.testid]);
    if (rule.length > 0 && rule[0].creationrule !== "{}") {
      const result = JSON.parse(rule[0].creationrule);
      return result;
    }
    return [];
  }
  
  async getTestResultRecord(testname, billingid, patientid) {
    const tablename = `result${testpanel.generateTableName(testname)}`;
    const previousRecords = await promisifyQuery(`SELECT * FROM  \`${tablename}\` WHERE billingid = ? AND patientid = ?`, [
      billingid,
      patientid,
    ]);
    return previousRecords;
  }

  sanitize_patientid_billingid_query(csvid, ptid, target) {
    if (typeof target != "string" && !(Array.isArray(target))) throw new TypeError("Array or string separated by delimeter , required");
    if (typeof target == "string") target = target.split(",");
    let patientid = ptid.slice(target[1])
    let billingid = csvid.slice(target[0])
    if (!isNaN(patientid) && !isNaN(billingid)) {
      patientid = parseInt(patientid);
      billingid = parseInt(billingid);
    }
    return { patientid, billingid };
  }


  async getPrevResultRecords(billingid, patientid, testname, count = 1) {
    const tableName = testpanel.generateTableName(testname);
    const query = `SELECT * FROM \`result${tableName}\` WHERE  patientid = ? AND billingid NOT IN (${billingid}) ORDER BY id DESC LIMIT ?`;
    return await promisifyQuery(query, [patientid, count]);
  }

  async gtTestNamebyId(testid) {
    const row = await promisifyQuery("SELECT name from test_panels WHERE id = ?", [parseInt(testid)]);
    return row.length > 0 ? row[0]['name'] : null;
  }

  async getCustomPreviousRecords(csvid, ptid, target, testid) {
    try {
      var testname = await this.gtTestNamebyId(testid);
      if (testname.length === 0) return false;
      const { patientid, billingid } = this.sanitize_patientid_billingid_query(csvid, ptid, target);
      const previousRecords = await this.getTestResultRecord(testname, billingid, patientid);
      if (previousRecords.length > 0) {
        if (previousRecords.some(
          (item, index) => item.field == "ultrasound")) return previousRecords[0];
      }

      const prev = await this.getPrevResultRecords(billingid, patientid, testname);
      let result = await this.getTestCreationRule();
      const hasGenderVariation = result.length == 0 ? false : result.filter((item) => item.hasGenderVariation == true).length > 0;

      let clientGender = "";
      if (hasGenderVariation) {
        const packet = await promisifyQuery("SELECT gender,age,agetype FROM new_patients WHERE patientid = ?", patientid);
        if (packet.length > 0) clientGender = packet[0]["gender"];
      }


      if (previousRecords.length > 0) {
        result = result.map((item, index) => {
          const matched = previousRecords.find((u, inx) => u.field == item.name);
          return matched ? { ...item, value: matched?.value ,entrymode:matched?.entrymode} : item;
        });
      }

      if (hasGenderVariation && clientGender) {
        result = result.map((item, index) => {
          const obj = {};
          for (const [key, value] of Object.entries(item)) {
            obj[key] = value;
            if (item.hasOwnProperty(clientGender)) {
              if (clientGender == "male") {
                obj["upperlimit"] = item[clientGender].upperlimit;
                obj["lowerlimit"] = item[clientGender].lowerlimit;
              } else {
                obj["upperlimit"] = item[clientGender].upperlimit;
                obj["lowerlimit"] = item[clientGender].lowerlimit;
              }
              delete obj.female;
              delete obj.male;
            }
          }
          return obj;
        });
      }
      
      if (prev.length > 0) {
        for (const parameter of result) {
          const _matched = prev.find((item, index) => parameter.name == item.field);
          parameter.previous_record = _matched || { value: null };
        }
      }
      return { testname, result };
    } catch (err) {
      throw err;
    }
  }


  async getResultEntryTest(scvid, ptid, target) {
    if (typeof target == "string") target = target.split(",");
    const patientid = ptid.slice(target[1]);
    const billingid = scvid.slice(target[0]);
    const patientdata = await new Registration(parseInt(patientid)).getPatientBasicData();
    const test_collection_query = `SELECT tp.name,ta.testid FROM test_ascension AS ta INNER JOIN test_panels AS tp ON tp.id = ta.testid WHERE ta.billingid = ?`;
    const collection = await promisifyQuery(test_collection_query, [parseInt(billingid)]);
    return { personal_data: patientdata[0] || {}, test: collection || [] }
  }

  async getCustomCommentsRecords(csvid, ptid, target, testid) {
    if (!csvid || !testid) {
      throw new Error("testid and billingid required");
    }
    const { billingid } = this.sanitize_patientid_billingid_query(csvid, ptid, target);
    let comments = await promisifyQuery("SELECT comments FROM result_comments WHERE billingid = ? AND testid = ?", [billingid, testid]);
    comments = comments.length > 0 ? comments[0]["comments"] : "";
    return comments;
  }

  async updateTestCreationRule(data) {
    if (!this.testid || !data) throw new Error("testid and data  is required");
    const stringdata = JSON.stringify(data);
    const query = "UPDATE customtestcreation SET creationrule = ? WHERE testid = ?";
    const isUpdated = await promisifyQuery(query, [stringdata, this.testid]);
    return rowAffected(isUpdated);
  }


  async resultEntry(request, response) {
    const { csvid, ptid, testid, fields, employeeid, comments, isScan } = request.body

    if (!csvid || !ptid || !testid || !fields) {
      return customError("billingid, patientid, testid,test and fields are required", 400, response)
    }

    if (fields.length == 0) {
      return customError("Field length must not be 0", 400, response)
    }

    let { billingid, patientid } = this.sanitize_patientid_billingid_query(csvid, ptid, '70,50');

    if (typeof billingid != "number" || typeof patientid != "number") {
      return customError(`patientid and billingid must be type number`, 400, response)
    }
    const testname = await this.gtTestNamebyId(testid);

    const tablename = `result${testpanel.generateTableName(testname)}`;

    const shouldCreateRecord = async function (billingid, patientid, testtable, field) {
      const records = await promisifyQuery(
        `SELECT * FROM ${testtable} WHERE billingid = ? AND field = ? AND patientid = ?`, [
        billingid,
        field,
        patientid,
      ])
      return records.length === 0
    }

    let ascensionQuery = `UPDATE test_ascension SET ready = 'true', ready_date = NOW()`;

    const isApprovalTrue = await new CustomTest().isApprovalSetTrue();

    if (isApprovalTrue === false) {
      ascensionQuery += `,ApprovalStatus = 1`
    }

    ascensionQuery += ` WHERE billingid = ? AND testid = ?`

    const insertUpdate = async function () {
      const insertAll = await Promise.all(
        fields.map(async (item, index) => {
          if (await shouldCreateRecord(billingid, patientid, tablename, item.field)) {
            const values = [item.field, billingid, patientid, item.value, employeeid]

            const query = `INSERT INTO ${tablename} (field,billingid,patientid,value,employeeid) VALUES(?,?,?,?,?)`;
            await new Operations().initiateStart(testid, billingid);
            await promisifyQuery(ascensionQuery, [billingid, testid])
            return rowAffected(await promisifyQuery(query, values))
          } else {
            const updateRecords = `UPDATE ${tablename} SET value = ?,updatedon =Now(),employeeid = ? WHERE patientid = ? AND billingid = ? AND field = ?`

            const result = await promisifyQuery(updateRecords, [item.value, employeeid, patientid, billingid, item.field])
            return rowAffected(result)
          }
        })
      )
      const isAllInserted = insertAll.some((a, i) => a == false)

      const pushCommentsQuery = `UPDATE result_comments SET COMMENTS = ? WHERE BILLINGID = ? AND TESTID = ?`

      const commentSection = async function () {
        const isRecordAvailable = await promisifyQuery(`SELECT * FROM result_comments WHERE testid = ? AND billingid = ?`, [
          testid,
          billingid,
        ])

        if (isRecordAvailable.length > 0) {
          return rowAffected(await promisifyQuery(pushCommentsQuery, [comments, billingid, testid]))
        } else {
          return rowAffected(
            await promisifyQuery(`INSERT INTO RESULT_COMMENTS (TESTID,BILLINGID,COMMENTS) VALUES (?,?,?)`, [testid, billingid, comments])
          )
        }
      }

      const isCommented = await commentSection()

      if (isAllInserted === false && isCommented) {
        response.send({ status: "success", statusCode: 200, message: "records updated successfully" })
      } else {
        response.send({ status: "failed", statusCode: 404, message: "error occured saving results" })
      }
    }

    await insertUpdate();

  }
}

module.exports = Creator;
