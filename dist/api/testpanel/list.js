"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testpanel = void 0;
const helper_1 = require("../../helper");
const resultTablesMigrations_1 = __importDefault(require("../../dist/models/migrations/resultTablesMigrations"));
const categories_1 = require("./categories");
exports.testpanel = {
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
    listqueryid: (action, id) => {
        return `${action} FROM test_panels WHERE ID = ${id}`;
    },
    hasquery: (request) => {
        return Object.keys(request.query).length > 0;
    },
    updatequery: (id, price, category) => {
        return `UPDATE test_panels SET price = ${price}, category = ${category} WHERE id = ${id}`;
    },
    postquery: (name, price, category) => {
        return `INSERT INTO test_panels (NAME, CATEGORY, PRICE) VALUES ('${name}', '${category}', ${price})`;
    },
    panelExist: async (name) => {
        const query = "SELECT name FROM test_panels WHERE name = ?";
        return (await (0, helper_1.promisifyQuery)(query, [name])).length > 0;
    },
    getPanels: async (request, response) => {
        try {
            if (exports.testpanel.hasquery(request)) {
                const { id } = request.query;
                const result = await (0, helper_1.promisifyQuery)(exports.testpanel.listqueryid("SELECT *", parseInt(id)));
                response.send({ statusCode: 200, status: "success", message: "success", data: result });
            }
            else {
                const result = await (0, helper_1.promisifyQuery)(exports.testpanel.listquery);
                response.send({ statusCode: 200, status: "success", message: "success", data: result });
            }
        }
        catch (err) {
            helper_1.logger.error(err);
            response.status(500).send({ statusCode: 500, status: "error", message: err.message });
        }
    },
    updatePanel: async (request, response) => {
        const { id, price, category } = request.query;
        if (!id || !price || !category)
            return (0, helper_1.customError)("Required request query missing", 404, response);
        const hasFieldValues = (0, categories_1.allFieldsHasValues)(request.body);
        if (hasFieldValues) {
            const query = exports.testpanel.updatequery(parseInt(id), parseFloat(price), parseInt(category));
            const result = await (0, helper_1.promisifyQuery)(query);
            return (0, helper_1.rowAffected)(result) ? response.send({ message: "Panel updated successfully" }) : response.send({ message: "Update failed" });
        }
        return response.send({ message: "All fields must have values" });
    },
    deletePanel: async (testid) => {
        if (!testid || isNaN(testid))
            throw new Error("testid not provided");
        const iscustomQuery = `SELECT iscustom, name FROM test_panels WHERE id = ?`;
        const result = await (0, helper_1.promisifyQuery)(iscustomQuery, [testid]);
        if (result.length === 0)
            return false;
        const isCustom = result[0]["iscustom"];
        if (isCustom === 0)
            return false;
        const isDeleted = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(`DELETE FROM test_panels WHERE id = ? AND iscustom = 1`, [testid]));
        if (isDeleted) {
            const testname = result[0]["name"].replace(/ /g, "_");
            const dropTableQ = `DROP TABLE result${testname}`;
            await (0, helper_1.promisifyQuery)(dropTableQ);
            return true;
        }
    },
    postPanel: async (request, response) => {
        const isFieldsOkay = !Object.values(request.body).some((value) => !value);
        if (isFieldsOkay) {
            request.body.samplevolume = parseInt(request.body.samplevolume);
            const { test, price, category, unit, sample, samplevolume, samplecontainer, description } = request.body;
            const panelExist = await exports.testpanel.panelExist(test);
            if (panelExist) {
                return response.send({ statusCode: 200, status: "success", message: "Panel already exists" });
            }
            else {
                const query = `INSERT INTO test_panels (name, price, category, unit, qty_required, sample_container, description, sample) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                const values = [test, price, category, unit, samplevolume, samplecontainer, description, sample];
                const outcome = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, values));
                return outcome
                    ? response.send({ statusCode: 201, status: "success", message: "Panel created successfully" })
                    : response.send({ statusCode: 200, status: "error", message: "Panel creation failed" });
            }
        }
    },
    addSampleType: async (request, response) => {
        const query = "INSERT INTO sampletype (name) VALUE (?)";
        const { name } = request.body;
        const result = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [name]));
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
    getSampleType: async (response) => {
        const samples = await (0, helper_1.promisifyQuery)("SELECT * FROM sampletype");
        response.send({ result: samples });
    },
    deleteSampleType: async (request, response) => {
        try {
            const { id } = request.query;
            if (!id || isNaN(parseInt(id)))
                return (0, helper_1.customError)("Valid id not provided", 404, response);
            const deleteQuery = "DELETE FROM sampletype WHERE id = ?";
            const result = await (0, helper_1.promisifyQuery)(deleteQuery, [parseInt(id)]);
            return (0, helper_1.rowAffected)(result)
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
        }
        catch (err) {
            response.send({
                message: err.message,
                statusCode: 500,
                status: "error",
            });
        }
    },
    bulkTestUpdate: async (request, response) => {
        const { panel } = request.body;
        if (!panel) {
            response.send({ message: "Panel required", statusCode: "400", status: "error" });
        }
        else {
            if (Array.isArray(panel) && panel.length > 0) {
                try {
                    panel.forEach(async (item, index) => {
                        const { id, name, price, sample, category, qty_required } = item;
                        const queryString = `UPDATE test_panels SET 
             name = ?, price = ?, sample = ?, category = ?, qty_required = ? WHERE id = ?`;
                        const result = await (0, helper_1.promisifyQuery)(queryString, [name, price, sample, category, qty_required, id]);
                        if (result.affectedRows > 0) {
                            if (index === panel.length - 1) {
                                response.send({ message: "Update successful", statusCode: "201", status: "success" });
                            }
                        }
                    });
                }
                catch (err) {
                    helper_1.logger.error(err);
                    response.send({ message: err.message, statusCode: "500", status: "error" });
                }
            }
        }
    },
    hasTest: async (testname) => {
        if (!testname)
            throw new Error("Testname required");
        const result = await (0, helper_1.promisifyQuery)(`SELECT COUNT(*) AS count FROM test_panels WHERE name = ?`, [testname.trim()]);
        return result[0]["count"] == 0 ? false : true;
    },
    hasTrend: async (testid) => {
        if (!testid)
            throw new Error("Testid required");
        const result = await (0, helper_1.promisifyQuery)(`SELECT showtrend FROM testdetails WHERE testid = ?`, [testid]);
        return result[0]["showtrend"] == 0 ? false : true;
    },
    updateProcedureManual: async (manual, testid, employeeid, title) => {
        if (!manual || typeof manual !== "string" || !testid || typeof testid !== "number" || !employeeid) {
            throw new Error("employeeid, manual and testid of string and number type respectively are required");
        }
        const query = `UPDATE proceduremanual SET 
       proceduremanual = ?,
       title = ?,
       updatedon = NOW(),
       createdby = ? WHERE testid = ?`;
        return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [manual, title, employeeid, testid]));
    },
    getProcedureManuel: async (testid) => {
        if (!testid)
            return false;
        const query = `SELECT * FROM proceduremanual WHERE testid = ?`;
        return await (0, helper_1.promisifyQuery)(query, [testid]);
    },
    putSingleTestPanel: async (request, response) => {
        try {
            const { id } = request.body;
            if (!id)
                return (0, helper_1.customError)(`Query id required`, 404, response);
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
                const { name, category, testprice, sample_container, unit, sample, shorttext, isoutsourced, description, qty_required, hasManual, procedureCode, tat, pre_Tat, post_Tat, showtrend, hasChildrenLimit, hasGenderVariation, tatCount, employeeid, testid, testcost, useLiterature, } = request.body;
                const updateMainPanel = await (0, helper_1.promisifyQuery)(query, [
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
                const outcome = (0, helper_1.rowAffected)(updateMainPanel);
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
                    const updateTestDetails = await (0, helper_1.promisifyQuery)(updatePanel, values);
                    const isCategoryScan = await (0, helper_1.promisifyQuery)(`SELECT tp.category, tp.name, dp.department FROM test_panels AS tp INNER JOIN departments AS dp ON dp.id = tp.category WHERE dp.department = 'ultrasound' AND tp.category = ${category}`);
                    if (isCategoryScan.length > 0) {
                        const tablename = "result" + exports.testpanel.generateTableName(isCategoryScan[0]["name"]);
                        const tableFeatures = await (0, helper_1.promisifyQuery)(`SHOW COLUMNS FROM ${tablename}`);
                        for (let i = 0; i < tableFeatures.length; i++) {
                            if (tableFeatures[i]["Field"] == "value" && tableFeatures[i]["Type"] != "longtext") {
                                await (0, helper_1.promisifyQuery)(`ALTER TABLE ${tablename} CHANGE value value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL;`);
                            }
                        }
                    }
                    response.send({ status: (0, helper_1.rowAffected)(updateTestDetails) ? "success" : "failed" });
                }
            }
        }
        catch (err) {
            response.send(err);
        }
    },
    getpanelsbulk: async (request, response) => {
        const query = `SELECT * FROM test_panels`;
        try {
            let result = await (0, helper_1.promisifyQuery)(query);
            if (result.length > 0) {
                result = result.map((item) => {
                    return (0, helper_1.convertKeysToLowerCase)(Object.assign(Object.assign({}, item), { sampleid: null }));
                });
            }
            response.send({ message: "Success", statusCode: 200, status: "success", data: result });
        }
        catch (err) {
            helper_1.logger.error(err);
            response.send({ message: err.message, statusCode: 500, status: "error" });
        }
    },
    getPanelEditSingle: async (testid) => {
        const query = `SELECT * FROM test_panels AS tp INNER JOIN testdetails AS td ON td.testid = tp.id
    WHERE tp.id = ?`;
        return await (0, helper_1.promisifyQuery)(query, [testid]);
    },
    generateTableName: (testname) => {
        if (!testname)
            return false;
        if (typeof testname != "string")
            throw new TypeError("String required");
        const Ttestname = testname.split("");
        const len = testname.length;
        for (let i = 0; i < len; i++) {
            if ((0, helper_1.hasSpecialCharacters)(testname[i], ["(", ")"])) {
                Ttestname[i] = "";
            }
            if (Ttestname[i] == " ") {
                Ttestname[i] = "_";
            }
        }
        return Ttestname.join("");
    },
    generatedTestTableName: function (testname) {
        return `result${this.generateTableName(testname)}`.trim();
    },
    generateAuditLogName: function (testname) {
        const tablename = this.generateTableName(testname);
        return `result${tablename}AuditLog`.trim();
    },
    testTableExist: async function (testname) {
        const tablename = this.generatedTestTableName(testname);
        const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                    FROM information_schema.tables 
                    WHERE table_schema = 'limsdb' 
                    AND table_name = ?`;
        const info = await (0, helper_1.promisifyQuery)(tableExistenceQuery, [tablename]);
        return info[0]["ispresent"] === 1;
    },
    createTestProcess: async function (testname) {
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
            await (0, helper_1.promisifyQuery)(createTestTableQuery);
            await (0, helper_1.promisifyQuery)(createAuditLogTableQuery);
            await (0, helper_1.promisifyQuery)(createUpdateTriggerQuery);
            await (0, helper_1.promisifyQuery)(createDeleteTriggerQuery);
            return true;
        }
        catch (err) {
            throw err;
        }
    },
    getTestUsingTestid: async function (testid) {
        const query = `SELECT name FROM test_panels WHERE id = ?`;
        const packets = await (0, helper_1.promisifyQuery)(query, [testid]);
        if (packets.length == 0)
            return false;
        return packets[0]['name'];
    },
    createCustomTest: async function (testname, iscustom = 1) {
        let hasTestBeenCreated = false;
        try {
            if (!testname) {
                throw new Error("Testname required");
            }
            if (await this.hasTest(testname)) {
                return "EXIST";
            }
            const query = `INSERT INTO test_panels (name, iscustom) VALUES (?, ?)`;
            const istestcreated = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [testname, iscustom]));
            if (istestcreated) {
                hasTestBeenCreated = true;
                await this.createTestProcess(testname);
            }
        }
        catch (err) {
            if (hasTestBeenCreated) {
                await (0, helper_1.promisifyQuery)(`DELETE FROM test_panels WHERE name = ?`, [testname]);
                throw new Error("Test creation failed");
            }
        }
    },
    changeTestName: async function (testid, newTestName) {
        try {
            if (typeof newTestName != "string" || newTestName.length < 2) {
                return "invalid test length provided" /* OperationsFailures.invalidTestLength */;
            }
            ;
            const savedOldTestName = await this.getTestUsingTestid(testid);
            if (!savedOldTestName)
                return "such id not found" /* OperationsFailures.unfoundID */;
            if (savedOldTestName === newTestName)
                return false;
            const doTestWithSuchNameExist = await this.hasTest(newTestName);
            if (doTestWithSuchNameExist)
                return false;
            const oldTestTableGenerated = this.generatedTestTableName(savedOldTestName);
            const generatedAuditLogTableOld = `result${oldTestTableGenerated}AuditLog`.trim().toLowerCase();
            const newTestNameGenerated = this.generatedTestTableName(newTestName);
            const generatedAuditLogNewTable = `result${newTestNameGenerated}AuditLog`.trim().toLowerCase();
            const q_alterTestName = `UPDATE test_panels SET name =? WHERE id = ? `;
            const q_RenameTestTable = `RENAME TABLE ${oldTestTableGenerated} TO ${newTestNameGenerated}`;
            const q_RenameTestTableAudit = `RENAME TABLE ${generatedAuditLogTableOld} TO ${generatedAuditLogNewTable}`;
            await (0, helper_1.promisifyQuery)(q_RenameTestTable);
            await (0, helper_1.promisifyQuery)(q_alterTestName, [newTestName, testid]);
            console.log(oldTestTableGenerated);
            const Reconfiguring = new resultTablesMigrations_1.default();
            await Reconfiguring.deleteTestResultTableTriggers(oldTestTableGenerated);
            await (0, helper_1.promisifyQuery)(q_RenameTestTableAudit);
            return true;
        }
        catch (error) {
            console.log(error);
            console.log(error);
        }
    }
};
