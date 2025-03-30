import { customError, promisifyQuery, rowAffected } from "../../../helper";
import { testpanel } from "../../testpanel/list";
import ApplicationSettings from "../application/appsettings/appset";
import Operations from "../operations/operations";
import { _comments_query, getGenderQuery, q_get_test_ascension_name_and_id, testCreationRule, update_creation_query } from "./queries";
import Registration from "../registration/registration";
interface CreationRule {
  name: string;
  value?: string;
  hasGenderVariation?: boolean;
  male?: { upperlimit: number; lowerlimit: number };
  female?: { upperlimit: number; lowerlimit: number };
  upperlimit?: number;
  lowerlimit?: number;
  [key: string]: any;
}

class Creator {
  testid: string;

  constructor(testid: string) {
    this.testid = testid;
  }

  async getTestCreationRule() {
    if (!this.testid) throw new Error("testid is required");
    const rule = await promisifyQuery(testCreationRule, [this.testid]);
    if (rule.length > 0 && rule[0].creationrule !== "{}") {
      const result = JSON.parse(rule[0].creationrule) as CreationRule[];
      return result;
    }
    return [];
  }

  async getPreviousRecords(testname: string, billingid: string, patientid: string) {
    const tablename = testpanel.generatedTestTableName(testname);
    const previousRecords = await promisifyQuery(`SELECT * FROM ${tablename} WHERE billingid = ? AND patientid = ?`, [
      billingid,
      patientid,
    ]);
    return previousRecords;
  }

  async getResultEntryTest(scvid: string, ptid: string, target: any) {
    if (typeof target == "string") target = target.split(",");
    const patientid: number = parseInt(ptid.slice(target[1]));
    const billingid: number = parseInt(scvid.slice(target[0]));
    const patientdata: [] = await new Registration().getPatientBasicData(patientid);
    if (patientdata.length === 0) {
      throw new Error("patient not found.");
    }
    const collection: [] = await promisifyQuery(q_get_test_ascension_name_and_id, [billingid]);
    if (collection.length > 0) {
      return { personal_data: patientdata.slice(0, 1), test: collection || [] };
    }
    return { personal_data: patientdata || {}, test: collection || [] };
  }

  async getCustomPreviousRecords(testid: number, billingid: string, patientid: string) {
    try {
      const testname = await testpanel.getTestUsingTestid(testid);
      if (testname === false) {
        throw new Error("wrong testid provided");
      }
      const previousRecords = await this.getPreviousRecords(testname, billingid, patientid);
      if (previousRecords.length > 0 && previousRecords.some((item) => item.field === "ultrasound")) {
        return previousRecords[0];
      }

      let result = await this.getTestCreationRule();

      const hasGenderVariation = result.length > 0 && result.some((item) => item.hasGenderVariation === true);

      let clientGender = "";

      if (hasGenderVariation) {
        const packet = await promisifyQuery(getGenderQuery, [patientid]);
        if (packet.length > 0) clientGender = packet[0]["gender"];
      }

      if (previousRecords.length === 0) return result;

      result = result.map((item) => {
        const { name } = item;
        const matched = previousRecords.find((u) => u.field === name);
        return matched ? { ...item, value: matched.value } : item;
      });

      if (hasGenderVariation && clientGender) {
        result = result.map((item) => {
          const obj: any = { ...item };
          if (item[clientGender]) {
            obj.upperlimit = item[clientGender].upperlimit;
            obj.lowerlimit = item[clientGender].lowerlimit;
            delete obj.female;
            delete obj.male;
          }
          return obj;
        });
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getCustomCommentsRecords(billingid: string, testid: string) {
    if (!billingid || !testid) {
      throw new Error("testid and billingid required");
    }
    let comments = await promisifyQuery(_comments_query, [billingid, testid]);
    return comments.length > 0 ? comments[0]["comments"] : "";
  }

  async updateTestCreationRule(data: CreationRule[]) {
    if (!this.testid || !data) throw new Error("testid and data is required");
    const stringdata = JSON.stringify(data);
    const isUpdated = await promisifyQuery(update_creation_query, [stringdata, this.testid]);
    return rowAffected(isUpdated);
  }

  public async sanitize_patientid_billingid_query(csvid: string, ptid: string, target: string | string[]) {
    if (typeof target != "string" && !Array.isArray(target)) throw new TypeError("Array or string separated by delimeter , required");
    let splitter = target;
    if (typeof target == "string") {
      splitter = target.split(",");
    }

    const ptsplitter = parseInt(splitter[1]);
    const blsplitter = parseInt(splitter[0]);
    let patientid = ptid.slice(ptsplitter);
    let billingid = csvid.slice(blsplitter);

    if (!isNaN(patientid as any) && !isNaN(billingid as any)) {
      patientid = parseInt(patientid) as any;
      billingid = parseInt(billingid) as any;
    }
    return { patientid, billingid };
  }

  public async resultEntry(request, response) {
    const { csvid, ptid, testid, fields, employeeid, comments, isScan } = request.body;

    if (!csvid || !ptid || !testid || !fields) {
      return customError("billingid, patientid, testid,test and fields are required", 400, response);
    }

    if (fields.length == 0) {
      return customError("Field length must not be 0", 400, response);
    }

    let { billingid, patientid } = await this.sanitize_patientid_billingid_query(csvid, ptid, "70,50");

    if (typeof billingid != "number" || typeof patientid != "number") {
      return customError(`patientid and billingid must be type number`, 400, response);
    }
    const testname = await testpanel.getTestUsingTestid(testid);

    const tablename = testpanel.generatedTestTableName(testname).toLowerCase();

    const shouldCreateRecord = async function (billingid: number, patientid: number, testtable: string, field) {
      const records = await promisifyQuery(`SELECT * FROM ${testtable} WHERE billingid = ? AND field = ? AND patientid = ?`, [
        billingid,
        field,
        patientid,
      ]);
      return records.length === 0;
    };

    let ascensionQuery = `UPDATE test_ascension SET ready = 'true', ready_date = NOW()`;

    const isApprovalTrue = await new ApplicationSettings().isApprovalSetTrue();

    if (isApprovalTrue === false) {
      ascensionQuery += `,ApprovalStatus = 1`;
    }

    ascensionQuery += ` WHERE billingid = ? AND testid = ?`;

    const insertUpdate = async function () {
      const insertAll = await Promise.all(
        fields.map(async (item: any, index: number) => {
          if (await shouldCreateRecord(billingid, patientid, tablename, item.field)) {
            const values = [item.field, billingid, patientid, item.value, employeeid, item?.entrymode];
            const query = `INSERT INTO ${tablename} (field,billingid,patientid,value,employeeid,entrymode) VALUES(?,?,?,?,?,?)`;
            await new Operations(billingid).initiateTestProcessing(testid, billingid);
            await promisifyQuery(ascensionQuery, [billingid, testid]);
            return rowAffected(await promisifyQuery(query, values));
          } else {
            const updateRecords = `UPDATE ${tablename} SET value = ?,updatedon =Now(),employeeid = ?,entrymode = ? WHERE patientid = ? AND billingid = ? AND field = ?`;

            const result = await promisifyQuery(updateRecords, [item.value, employeeid, item?.entrymode, patientid, billingid, item.field]);
            return rowAffected(result);
          }
        })
      );
      const isAllInserted = insertAll.some((a, i) => a == false);

      const pushCommentsQuery = `UPDATE result_comments SET COMMENTS = ? WHERE BILLINGID = ? AND TESTID = ?`;

      const commentSection = async function () {
        const isRecordAvailable = await promisifyQuery(`SELECT * FROM result_comments WHERE testid = ? AND billingid = ?`, [
          testid,
          billingid,
        ]);

        if (isRecordAvailable.length > 0) {
          return rowAffected(await promisifyQuery(pushCommentsQuery, [comments, billingid, testid]));
        } else {
          return rowAffected(
            await promisifyQuery(`INSERT INTO RESULT_COMMENTS (TESTID,BILLINGID,COMMENTS) VALUES (?,?,?)`, [testid, billingid, comments])
          );
        }
      };

      const isCommented = await commentSection();

      if (isAllInserted === false && isCommented) {
        response.send({ status: "success", statusCode: 200, message: "records updated successfully" });
      } else {
        response.send({ status: "failed", statusCode: 404, message: "error occured saving results" });
      }
    };

    await insertUpdate();
  }
}

export default Creator;
