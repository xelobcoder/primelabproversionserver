const { convertKeysToLowerCase, promisifyQuery, customError, rowAffected, hasSpecialCharacters } = require("../../helper");
const logger = require("../../logger");
const { allFieldsHasValues } = require("./categories");
const testpanel = {
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
  listqueryid: function (action, id) {
    return `${action} FROM test_panels WHERE ID = ${id}`;
  },
  hasquery: function (request) {
    return Object.keys(request.query).length > 0 ? true : false;
  },
  updatequery: function (id, price, category) {
    return `UPDATE test_panels SET price = ${price}, category = ${category} WHERE id = ${id}`;
  },
  postquery: function (name, price, category) {
    return `INSERT INTO test_panels (NAME,CATEGORY,PRICE) VALUES ('${name}','${category}','${price}')`;
  },
  panelExist: async function (name) {
    const query = "SELECT name FROM test_panels WHERE name = ?";
    return (await promisifyQuery(query, [name])).length > 0;
  },
  getPanels: async function (request, response) {
    try {
      if (this.hasquery(request)) {
        const { id } = request.query;
        const result = await promisifyQuery(this.listqueryid("SELECT *", id));
        response.send({ statusCode: 200, status: "success", message: "success", data: result });
      } else {
        const result = await promisifyQuery(this.listquery);
        response.send({ statusCode: 200, status: "success", message: "success", data: result });
      }
    } catch (err) {
      logger.error(err);
    }
  },
  updatePanel: function (request, response) {
    const { id, price, category } = request.query;
    if (!id || !price || !category) return customError("Required request query missing", 404, response);
    const has_field_values = allFieldsHasValues(request.body);
    if (has_field_values) {
      const _rows = this.updatequery(id, price, category);
      return affectedRows(_rows) ? response.send({ message: "panel updated successfully" }) : response.send({ message: "update failed" });
    }
    return response.send({
      message: "All fields must have values",
    });
  },
  deletePanel: async function (testid) {
    if (!testid || isNaN(testid)) throw new Error("testid not provided");
    const iscustomQuery = `SELECT iscustom,name FROM test_panels WHERE id = ?`;
    const result = await promisifyQuery(iscustomQuery, [parseInt(testid)]);
    if (result.length === 0) return false;
    let isCustom = result[0]["iscustom"];
    if (isCustom === 0) return false;
    const isdeleted = rowAffected(await promisifyQuery(`DELETE FROM test_panels WHERE id = ? AND iscustom = 1`, [parseInt(testid)]));
    if (isdeleted) {
      const testname = result[0]["name"].toString().replaceAll(" ", "_");
      const dropTableQ = `DROP TABLE result${testname}`;
      await promisifyQuery(dropTableQ);
      return true;
    }
  },
  postPanel: async function (request, response) {
    const isFieldsOkay =
      Object.values(request.body).filter((value) => value == "" || value == null || value == undefined || value == 0).length > 0
        ? false
        : true;

    if (isFieldsOkay) {
      request.body.samplevolume = parseInt(request.body.samplevolume);
      const { test, price, category, unit, sample, samplevolume, samplecontainer, description } = request.body;
      let panelExist = await this.panelExist(test);
      if (panelExist) {
        return response.send({
          statusCode: 200,
          status: "success",
          message: "Panel already exist",
        });
      } else {
        const query = `insert into test_panels (name, price, category, unit, qty_required, sample_container, description, sample) values (?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [test, price, category, unit, samplevolume, samplecontainer, description, sample];

        const outcome = rowAffected(await promisifyQuery(query, values));
        return outcome
          ? response.send({
              statusCode: 201,
              status: "success",
              message: "Panel created successfully",
            })
          : response.send({
              statusCode: 200,
              status: "error",
              message: "Panel creation failed",
            });
      }
    }
  },

  addSampleType: async function (request, response) {
    const query = "insert into sampletype (name) value (?)";
    const { name } = request.body;
    const result = rowAffected(await promisifyQuery(query, [name]));
    return result
      ? response.send({
          message: "added successfully",
          statusCode: 201,
          status: "success",
        })
      : response.send({
          message: "error adding sample type",
          statusCode: 500,
          status: "error",
        });
  },

  getSampleType: async function (response) {
    const samples = await promisifyQuery("SELECT * FROM sampletype");
    response.send({ result: samples });
  },
  deleteSampleType: async function (request, response) {
    try {
      const { id } = request.query;
      if (!id || isNaN(id)) return customError("Valid id not provided", 404, response);
      const deleteQuery = "DELETE FROM sampletype WHERE id = ?";
      const result = await promisifyQuery(deleteQuery, [parseInt(id)]);
      return rowAffected(result)
        ? response.send({
            message: "deleted successfully",
            statusCode: 200,
            status: "success",
          })
        : response.send({
            message: "deletion failed",
            statusCode: 200,
            status: "error",
          });
    } catch (err) {
      response.send({
        message: err.message,
        statusCode: 500,
        status: "error",
      });
    }
  },
  bulkTestUpdate: async function (request, response) {
    const { panel } = request.body;
    if (!panel) {
      response.send({ message: "panel required", statusCode: "400", status: "error" });
    } else {
      if (Array.isArray(panel) && panel.length > 0) {
        try {
          panel.forEach(async (item, index) => {
            const { id, name, price, sample, category, qty_required } = item;
            const queryString = `UPDATE test_panels SET 
             name = ?,price = ?,sample = ?,category = ?,qty_required = ? WHERE id  = ?`;
            const result = await promisifyQuery(queryString, [name, price, sample, category, qty_required, id]);
            if (result.affectedRows > 0) {
              if (index === panel.length - 1) {
                response.send({ message: "update successful", statusCode: "201", status: "success" });
              }
            }
          });
        } catch (err) {
          logger.error(err);
          response.send({ message: err.message, statusCode: "500", status: "error" });
        }
      }
    }
  },

  hasTest: async function (testname) {
    if (!testname) throw new Error("testname required");
    const result = await promisifyQuery(`SELECT COUNT(*)AS count FROM test_panels WHERE name = ? `, [testname.trim()]);
    return result[0]["count"] == 0 ? false : true;
  },

  hasTrend: async function (testid) {
    if (!testid) throw new Error("testid required");
    const result = await promisifyQuery(`SELECT showtrend FROM testdetails WHERE testid = ? `, [testid]);
    return result[0]["showtrend"] == 0 ? false : true;
  },

  updateProcedureManual: async function (manual, testid, employeeid, title) {
    if (!manual || typeof manual !== "string" || !testid || typeof testid !== "number" || !employeeid) {
      throw new Error("employeeid, manual and testid of string and number type respectively are required");
    }
    const query = `UPDATE proceduremanual SET 
       proceduremanual = ?,
       title = ?,
       updatedon = NOW(),
       createdby  = ? WHERE testid = ?`;
    return rowAffected(await promisifyQuery(query, [manual, title, employeeid, testid]));
  },

  getProcedureManuel: async function (testid) {
    if (!testid) return false;
    const query = `SELECT * FROM proceduremanual WHERE testid = ?`;
    return await promisifyQuery(query, [parseInt(testid)]);
  },

  putSingleTestPanel: async function (request, response) {
    try {
      const { id } = request.body;

      if (!id) return customError(`query id required`, 404, response);
      else {
        const query = `UPDATE test_panels SET
            name = ?,
            price = ?,
            sample_container = ?,
            sample= ?,
            category = ?,
            unit =?,
            description = ?,
            qty_required = ?,
            shorttext = ?
            WHERE id = ?`;

        const {
          name,
          category,
          testprice,
          id,
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
                  tat  = ?,
                  pre_Tat = ?,
                  post_Tat = ?,
                  hasManual = ?,
                  procedureCode = ? ,
                  tatCount = ?,
                  updatedby = ?,
                  updatedon = NOW(),
                  isoutsourced = ?,
                  showtrend = ?,
                  testprice = ?,
                  hasChildrenLimit =?,
                  hasGenderVariation= ?,
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
            `SELECT tp.category,tp.name,dp.department from test_panels AS tp INNER JOIN departments AS dp ON dp.id = tp.category WHERE dp.department = 'ultrasound' AND tp.category = ${category}`
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

  getpanelsbulk: async function (request, response) {
    const query = `SELECT * FROM test_panels`;

    try {
      let result = await promisifyQuery(query);
      if (result.length > 0) {
        result = result.map((item, index) => {
          return convertKeysToLowerCase({ ...item, sampleid: null });
        });
      }
      response.send({ message: "success", statusCode: 200, status: "success", data: result });
    } catch (err) {
      logger.error(err);
      response.send({ message: err.message, statusCode: 500, status: "error" });
    }
  },

  getPanelEditSingle: async function (testid) {
    const query = `SELECT * FROM test_panels AS tp INNER JOIN testdetails AS td ON td.testid = tp.id
    WHERE tp.id = ?`;
    return await promisifyQuery(query, [testid]);
  },

  generateTableName: function (testname) {
    if (!testname) return false;
    if (typeof testname != "string") throw new TypeError("string required");
    testname = testname.split("");
    const len = testname.length;
    for (let i = 0; i < len; i++) {
      if (hasSpecialCharacters(testname[i], ["(", ")"])) {
        testname[i] = "";
      }
      if (testname[i] == " ") testname[i] = "_";
    }
    return testname.join("");
  },

  generateAuditLogName: function (testname) {
    const tablename = this.generateTableName(testname);
    return `result${tablename}AuditLog`.trim();
  },
  createCustomTest: async function (testname, iscustom = 1) {
    let hasTestBeenCreated = false;
    try {
      if (!testname) {
        throw new Error("testname required");
      }
      if (await this.hasTest(testname)) {
        return "EXIST";
      }

      const query = `INSERT INTO test_panels (name,iscustom) VALUES(?,?)`;
      const istestcreated = rowAffected(await promisifyQuery(query, [testname, iscustom]));
      if (istestcreated) {
        hasTestBeenCreated = true;
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
      }
    } catch (err) {
      if (hasTestBeenCreated) {
        await promisifyQuery(`DELETE FROM test_panels WHERE name = ?`, [testname]);
        throw new Error("test creation failed");
      }
    }
  },
};

module.exports = testpanel;
