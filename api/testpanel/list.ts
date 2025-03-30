import { Request, Response } from "express";
import { promisifyQuery, rowAffected, customError, logger, hasSpecialCharacters, convertKeysToLowerCase } from "../../helper";
import TableReconfiguration from './../models/migrations/resultTablesMigrations'
import { allFieldsHasValues } from "./categories";
import { OperationsFailures } from "../models/operations/types";
interface TestPanel {
  id: number;
  name: string;
  price: number;
  sample: string;
  category: string;
  qty_required: number;
}

interface ProcedureManual {
  manual: string;
  testid: number;
  employeeid: number;
  title: string;
}

export const testpanel = {
  listquery: `SELECT 
      tp.name,
      tp.id,
      tp.price,
      tp.created_on,
      tp.description,
      s.name AS sample,
      tp.sample_container,
      tp.unit,
      tp.qty_required,
      d.department AS category
    FROM test_panels AS tp
      INNER JOIN departments AS d ON d.id = tp.category
      INNER JOIN sampletype AS s ON s.id = tp.sample`,

  listqueryid: (action: string, id: number) => {
    return `${action} FROM test_panels WHERE ID = ${id}`;
  },

  hasquery: (request: Request) => {
    return Object.keys(request.query).length > 0;
  },

  updatequery: (id: number, price: number, category: number) => {
    return `UPDATE test_panels SET price = ${price}, category = ${category} WHERE id = ${id}`;
  },

  postquery: (name: string, price: number, category: string) => {
    return `INSERT INTO test_panels (NAME, CATEGORY, PRICE) VALUES ('${name}', '${category}', ${price})`;
  },

  panelExist: async (name: string) => {
    const query = "SELECT name FROM test_panels WHERE name = ?";
    return (await promisifyQuery(query, [name])).length > 0;
  },

  getPanels: async (request: Request, response: Response) => {
    try {
      if (testpanel.hasquery(request)) {
        const { id } = request.query as { id: string };
        const result = await promisifyQuery(testpanel.listqueryid("SELECT *", parseInt(id)));
        response.send({ statusCode: 200, status: "success", message: "success", data: result });
      } else {
        const result = await promisifyQuery(testpanel.listquery);
        response.send({ statusCode: 200, status: "success", message: "success", data: result });
      }
    } catch (err) {
      logger.error(err);
      response.status(500).send({ statusCode: 500, status: "error", message: (err as Error).message });
    }
  },

  updatePanel: async (request: Request, response: Response) => {
    const { id, price, category } = request.query as { id: string; price: string; category: string };
    if (!id || !price || !category) return customError("Required request query missing", 404, response);
    const hasFieldValues = allFieldsHasValues(request.body);
    if (hasFieldValues) {
      const query = testpanel.updatequery(parseInt(id), parseFloat(price), parseInt(category));
      const result = await promisifyQuery(query);
      return rowAffected(result) ? response.send({ message: "Panel updated successfully" }) : response.send({ message: "Update failed" });
    }
    return response.send({ message: "All fields must have values" });
  },

  deletePanel: async (testid: number) => {
    if (!testid || isNaN(testid)) throw new Error("testid not provided");
    const iscustomQuery = `SELECT iscustom, name FROM test_panels WHERE id = ?`;
    const result = await promisifyQuery(iscustomQuery, [testid]);
    if (result.length === 0) return false;
    const isCustom = result[0]["iscustom"];
    if (isCustom === 0) return false;
    const isDeleted = rowAffected(await promisifyQuery(`DELETE FROM test_panels WHERE id = ? AND iscustom = 1`, [testid]));
    if (isDeleted) {
      const testname = result[0]["name"].replace(/ /g, "_");
      const dropTableQ = `DROP TABLE result${testname}`;
      await promisifyQuery(dropTableQ);
      return true;
    }
  },

  postPanel: async (request: Request, response: Response) => {
    const isFieldsOkay = !Object.values(request.body).some((value) => !value);
    if (isFieldsOkay) {
      request.body.samplevolume = parseInt(request.body.samplevolume);
      const { test, price, category, unit, sample, samplevolume, samplecontainer, description } = request.body;
      const panelExist = await testpanel.panelExist(test);
      if (panelExist) {
        return response.send({ statusCode: 200, status: "success", message: "Panel already exists" });
      } else {
        const query = `INSERT INTO test_panels (name, price, category, unit, qty_required, sample_container, description, sample) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [test, price, category, unit, samplevolume, samplecontainer, description, sample];
        const outcome = rowAffected(await promisifyQuery(query, values));
        return outcome
          ? response.send({ statusCode: 201, status: "success", message: "Panel created successfully" })
          : response.send({ statusCode: 200, status: "error", message: "Panel creation failed" });
      }
    }
  },
  addSampleType: async (request: Request, response: Response) => {
    const query = "INSERT INTO sampletype (name) VALUE (?)";
    const { name } = request.body;
    const result = rowAffected(await promisifyQuery(query, [name]));
    return result
      ? response.send({
        message: "Added successfully",
        statusCode: 201,
        status: "success",
      })
      : response.send({
        message: "Error adding sample type",
        statusCode: 500,
        status: "error",
      });
  },

  getSampleType: async (response: Response) => {
    const samples = await promisifyQuery("SELECT * FROM sampletype");
    response.send({ result: samples });
  },

  deleteSampleType: async (request: Request, response: Response) => {
    try {
      const { id } = request.query as { id: string };
      if (!id || isNaN(parseInt(id))) return customError("Valid id not provided", 404, response);
      const deleteQuery = "DELETE FROM sampletype WHERE id = ?";
      const result = await promisifyQuery(deleteQuery, [parseInt(id)]);
      return rowAffected(result)
        ? response.send({
          message: "Deleted successfully",
          statusCode: 200,
          status: "success",
        })
        : response.send({
          message: "Deletion failed",
          statusCode: 200,
          status: "error",
        });
    } catch (err) {
      response.send({
        message: (err as Error).message,
        statusCode: 500,
        status: "error",
      });
    }
  },

  bulkTestUpdate: async (request: Request, response: Response) => {
    const { panel } = request.body;
    if (!panel) {
      response.send({ message: "Panel required", statusCode: "400", status: "error" });
    } else {
      if (Array.isArray(panel) && panel.length > 0) {
        try {
          panel.forEach(async (item: TestPanel, index: number) => {
            const { id, name, price, sample, category, qty_required } = item;
            const queryString = `UPDATE test_panels SET 
             name = ?, price = ?, sample = ?, category = ?, qty_required = ? WHERE id = ?`;
            const result = await promisifyQuery(queryString, [name, price, sample, category, qty_required, id]);
            if (result.affectedRows > 0) {
              if (index === panel.length - 1) {
                response.send({ message: "Update successful", statusCode: "201", status: "success" });
              }
            }
          });
        } catch (err) {
          logger.error(err);
          response.send({ message: (err as Error).message, statusCode: "500", status: "error" });
        }
      }
    }
  },

  hasTest: async (testname: string) => {
    if (!testname) throw new Error("Testname required");
    const result = await promisifyQuery(`SELECT COUNT(*) AS count FROM test_panels WHERE name = ?`, [testname.trim()]);
    return result[0]["count"] == 0 ? false : true;
  },

  hasTrend: async (testid: number) => {
    if (!testid) throw new Error("Testid required");
    const result = await promisifyQuery(`SELECT showtrend FROM testdetails WHERE testid = ?`, [testid]);
    return result[0]["showtrend"] == 0 ? false : true;
  },

  updateProcedureManual: async (manual: string, testid: number, employeeid: number, title: string) => {
    if (!manual || typeof manual !== "string" || !testid || typeof testid !== "number" || !employeeid) {
      throw new Error("employeeid, manual and testid of string and number type respectively are required");
    }
    const query = `UPDATE proceduremanual SET 
       proceduremanual = ?,
       title = ?,
       updatedon = NOW(),
       createdby = ? WHERE testid = ?`;
    return rowAffected(await promisifyQuery(query, [manual, title, employeeid, testid]));
  },

  getProcedureManuel: async (testid: number) => {
    if (!testid) return false;
    const query = `SELECT * FROM proceduremanual WHERE testid = ?`;
    return await promisifyQuery(query, [testid]);
  },

  putSingleTestPanel: async (request: Request, response: Response) => {
    try {
      const { id } = request.body;

      if (!id) return customError(`Query id required`, 404, response);
      else {
        const query = `UPDATE test_panels SET
            name = ?,
            price = ?,
            sample_container = ?,
            sample = ?,
            category = ?,
            unit = ?,
            description = ?,
            qty_required = ?,
            shorttext = ?
            WHERE id = ?`;

        const {
          name,
          category,
          testprice,
          sample_container,
          unit,
          sample,
          shorttext,
          isoutsourced,
          description,
          qty_required,
          hasManual,
          procedureCode,
          tat,
          pre_Tat,
          post_Tat,
          showtrend,
          hasChildrenLimit,
          hasGenderVariation,
          tatCount,
          employeeid,
          testid,
          testcost,
          useLiterature,
        } = request.body;

        const updateMainPanel = await promisifyQuery(query, [
          name,
          testprice,
          sample_container,
          sample,
          category,
          unit,
          description,
          qty_required,
          shorttext,
          testid,
        ]);

        const outcome = rowAffected(updateMainPanel);
        if (outcome) {
          const updatePanel = `
          UPDATE testdetails SET 
                  tat = ?,
                  pre_Tat = ?,
                  post_Tat = ?,
                  hasManual = ?,
                  procedureCode = ?,
                  tatCount = ?,
                  updatedby = ?,
                  updatedon = NOW(),
                  isoutsourced = ?,
                  showtrend = ?,
                  testprice = ?,
                  hasChildrenLimit = ?,
                  hasGenderVariation = ?,
                  testcost = ?,
                  useLiterature = ?
          WHERE testid = ?`;

          const values = [
            tat,
            pre_Tat,
            post_Tat,
            hasManual,
            procedureCode,
            tatCount,
            employeeid,
            isoutsourced,
            showtrend,
            testprice,
            hasChildrenLimit,
            hasGenderVariation,
            testcost,
            useLiterature,
            testid,
          ];

          const updateTestDetails = await promisifyQuery(updatePanel, values);

          const isCategoryScan = await promisifyQuery(
            `SELECT tp.category, tp.name, dp.department FROM test_panels AS tp INNER JOIN departments AS dp ON dp.id = tp.category WHERE dp.department = 'ultrasound' AND tp.category = ${category}`
          );

          if (isCategoryScan.length > 0) {
            const tablename = "result" + testpanel.generateTableName(isCategoryScan[0]["name"]);
            const tableFeatures = await promisifyQuery(`SHOW COLUMNS FROM ${tablename}`);
            for (let i = 0; i < tableFeatures.length; i++) {
              if (tableFeatures[i]["Field"] == "value" && tableFeatures[i]["Type"] != "longtext") {
                await promisifyQuery(
                  `ALTER TABLE ${tablename} CHANGE value value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL;`
                );
              }
            }
          }

          response.send({ status: rowAffected(updateTestDetails) ? "success" : "failed" });
        }
      }
    } catch (err) {
      response.send(err);
    }
  },

  getpanelsbulk: async (request: Request, response: Response) => {
    const query = `SELECT * FROM test_panels`;

    try {
      let result = await promisifyQuery(query);
      if (result.length > 0) {
        result = result.map((item: any) => {
          return convertKeysToLowerCase({ ...item, sampleid: null });
        });
      }
      response.send({ message: "Success", statusCode: 200, status: "success", data: result });
    } catch (err) {
      logger.error(err);
      response.send({ message: (err as Error).message, statusCode: 500, status: "error" });
    }
  },

  getPanelEditSingle: async (testid: number) => {
    const query = `SELECT * FROM test_panels AS tp INNER JOIN testdetails AS td ON td.testid = tp.id
    WHERE tp.id = ?`;
    return await promisifyQuery(query, [testid]);
  },

  generateTableName: (testname: string) => {
    if (!testname) return false;
    if (typeof testname != "string") throw new TypeError("String required");
    const Ttestname = testname.split("");
    const len = testname.length;
    for (let i = 0; i < len; i++) {
      if (hasSpecialCharacters(testname[i], ["(", ")"])) {
        Ttestname[i] = "";
      }
      if (Ttestname[i] == " ") {
        Ttestname[i] = "_";
      }
    }
    return Ttestname.join("");
  },

  generatedTestTableName: function (testname: string) {
    return `result${this.generateTableName(testname)}`.trim();
  },

  generateAuditLogName: function (testname: string) {
    const tablename = this.generateTableName(testname);
    return `result${tablename}AuditLog`.trim();
  },

  testTableExist: async function (testname: string) {
    const tablename = this.generatedTestTableName(testname);
    const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                    FROM information_schema.tables 
                    WHERE table_schema = 'limsdb' 
                    AND table_name = ?`;

    const info = await promisifyQuery(tableExistenceQuery, [tablename]);
    return info[0]["ispresent"] === 1;
  },

  createTestProcess: async function (testname: string) {
    try {
      const generatedTableName = `result${this.generateTableName(testname)}`.trim();
      const auditLogTableName = `result${generatedTableName}AuditLog`.trim();

      const createTestTableQuery = `
        CREATE TABLE \`${generatedTableName}\` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            value VARCHAR(60),
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP,
            updatedon DATETIME(6) DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            employeeid INT,
            entrymode VARCHAR(20) DEFAULT 'manual',
            INDEX idx_billingid_patientid (billingid, patientid)
        )`;

      const createAuditLogTableQuery = `
        CREATE TABLE \`${auditLogTableName}\` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            previousValue VARCHAR(60),
            employeeid INT,
            fieldid INT,
            entrymode VARCHAR(20) DEFAULT 'manual',
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP
        )`;

      const createUpdateTriggerQuery = `
        CREATE TRIGGER \`trg_audit_log_update_${generatedTableName}\`
        AFTER UPDATE ON \`${generatedTableName}\`
        FOR EACH ROW
        BEGIN
            INSERT INTO \`${auditLogTableName}\` (
                previousValue,
                billingid,
                patientid,
                field,
                fieldid,
                employeeid,
                entrymode
            ) VALUES (
                OLD.value,
                OLD.billingid,
                OLD.patientid,
                OLD.field,
                OLD.id,
                OLD.employeeid,
                OLD.entrymode
            );
        END`;

      const createDeleteTriggerQuery = `
        CREATE TRIGGER \`trg_audit_log_delete_${generatedTableName}\`
        AFTER DELETE ON \`${generatedTableName}\`
        FOR EACH ROW
        BEGIN
           INSERT INTO \`${auditLogTableName}\` (
                previousValue,
                billingid,
                patientid,
                field,
                fieldid,
                employeeid,
                entrymode
            ) VALUES (
                OLD.value,
                OLD.billingid,
                OLD.patientid,
                OLD.field,
                OLD.id,
                OLD.employeeid,
                OLD.entrymode
            );
        END`;

      await promisifyQuery(createTestTableQuery);
      await promisifyQuery(createAuditLogTableQuery);
      await promisifyQuery(createUpdateTriggerQuery);
      await promisifyQuery(createDeleteTriggerQuery);
      return true;
    } catch (err) {
      throw err;
    }
  },

  getTestUsingTestid: async function (testid: number) {
    const query = `SELECT name FROM test_panels WHERE id = ?`;
    const packets = await promisifyQuery(query, [testid]);
    if (packets.length == 0) return false;
    return packets[0]['name'];
  },

  createCustomTest: async function (testname: string, iscustom: number = 1) {
    let hasTestBeenCreated = false;
    try {
      if (!testname) {
        throw new Error("Testname required");
      }
      if (await this.hasTest(testname)) {
        return "EXIST";
      }

      const query = `INSERT INTO test_panels (name, iscustom) VALUES (?, ?)`;
      const istestcreated = rowAffected(await promisifyQuery(query, [testname, iscustom]));
      if (istestcreated) {
        hasTestBeenCreated = true;
        await this.createTestProcess(testname);
      }
    } catch (err) {
      if (hasTestBeenCreated) {
        await promisifyQuery(`DELETE FROM test_panels WHERE name = ?`, [testname]);
        throw new Error("Test creation failed");
      }
    }
  },


  changeTestName: async function (testid: number, newTestName: string) {
    try {
      if (typeof newTestName != "string" || newTestName.length < 2) {
        return OperationsFailures.invalidTestLength
      };
      const savedOldTestName = await this.getTestUsingTestid(testid);
      if (!savedOldTestName) return OperationsFailures.unfoundID;
      if (savedOldTestName === newTestName) return false;

      const doTestWithSuchNameExist = await this.hasTest(newTestName);
      if (doTestWithSuchNameExist) return false;
      const oldTestTableGenerated = this.generatedTestTableName(savedOldTestName);

      const generatedAuditLogTableOld = `result${oldTestTableGenerated}AuditLog`.trim().toLowerCase();
      const newTestNameGenerated = this.generatedTestTableName(newTestName);
      const generatedAuditLogNewTable = `result${newTestNameGenerated}AuditLog`.trim().toLowerCase();

      const q_alterTestName = `UPDATE test_panels SET name =? WHERE id = ? `;
      const q_RenameTestTable = `RENAME TABLE ${oldTestTableGenerated} TO ${newTestNameGenerated}`;

      const q_RenameTestTableAudit = `RENAME TABLE ${generatedAuditLogTableOld} TO ${generatedAuditLogNewTable}`;
      await promisifyQuery(q_RenameTestTable);
      await promisifyQuery(q_alterTestName, [newTestName, testid]);

      const Reconfiguring = new TableReconfiguration();
      Reconfiguring.deleteTestResultTableTriggers(oldTestTableGenerated);
      Reconfiguring.createTestResultTriggers(newTestNameGenerated);

      await promisifyQuery(q_RenameTestTableAudit);
      return true;

    } catch (error) {
      console.log(error);
      console.log(error);
    }
  }
};


