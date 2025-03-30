"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../../../dist/testpanel/list");
const helper_1 = require("../../../helper");
class TableReconfiguration {
    async deleteTestTriggers(triggerName) {
        const delete_trigger = `DROP TRIGGER IF EXISTS  \`trg_audit_log_delete_${triggerName}\``;
        return await (0, helper_1.promisifyQuery)(delete_trigger);
    }
    async deleteTestUpdateTrigger(triggerName) {
        const delete_trigger = `DROP TRIGGER IF EXISTS  \`trg_audit_log_update_${triggerName}\``;
        return await (0, helper_1.promisifyQuery)(delete_trigger);
    }
    async alteringColumnNames(columnName, newName) {
        const q_checking_column_present = `SELECT COUNT(*) as count
                                           FROM information_schema.COLUMNS
                                           WHERE TABLE_SCHEMA = 'limsdb'
                                           AND TABLE_NAME = '${newName}'
                                           AND COLUMN_NAME = '${columnName}'`;
        const packet = await (0, helper_1.promisifyQuery)(q_checking_column_present);
        const hasColumn = packet[0]['count'] === 1;
        if (!hasColumn) {
            const altering = `ALTER TABLE ${newName}
                              ADD COLUMN entrymode VARCHAR(20) DEFAULT 'manual';`;
            await (0, helper_1.promisifyQuery)(altering);
            console.log('Column added successfully');
        }
    }
    async reconfigureTables(name) {
        try {
            const newName = list_1.testpanel.generatedTestTableName(name);
            const oldName = `result${name.toString().replace(/ /g, "_")}`;
            const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                         FROM information_schema.tables
                                         WHERE table_schema = 'limsdb'
                                         AND table_name = ?`;
            async function rename(oldName, newName) {
                const altername = `RENAME TABLE ${oldName} TO ${newName}`;
                await (0, helper_1.promisifyQuery)(altername);
            }
            const [isPresentOld, isPresentNew] = await Promise.all([
                (0, helper_1.promisifyQuery)(tableExistenceQuery, [oldName]),
                (0, helper_1.promisifyQuery)(tableExistenceQuery, [newName])
            ]);
            const old_pr = isPresentOld[0]["ispresent"];
            const new_pr = isPresentNew[0]["ispresent"];
            console.table({ oldName, newName, old_pr, new_pr });
            if (old_pr === 0 && new_pr === 0) {
                await list_1.testpanel.createTestProcess(name);
                return newName;
            }
            else if (old_pr === 1 && new_pr === 0) {
                await rename(oldName, newName);
                return newName;
            }
            else {
                return newName;
            }
        }
        catch (err) {
            throw err;
        }
    }
    async addingIndexToTable(item) {
        const test_table = list_1.testpanel.generatedTestTableName(item.name);
        const _checking_index = `SELECT COUNT(*) as count
                                 FROM information_schema.STATISTICS
                                 WHERE table_schema = 'limsdb'
                                 AND table_name = ?
                                 AND index_name = 'idx_billingid_patientid'`;
        const hasIndex = await (0, helper_1.promisifyQuery)(_checking_index, [test_table]);
        const count = hasIndex[0]['count'];
        if (count === 0) {
            const addingIndex = `ALTER TABLE ?? ADD INDEX idx_billingid_patientid (billingid, patientid)`;
            await (0, helper_1.promisifyQuery)(addingIndex, [test_table]);
        }
    }
    async hasAuditTable(item) {
        const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                     FROM information_schema.tables
                                     WHERE table_schema = 'limsdb'
                                     AND table_name = ?`;
        const test_table = list_1.testpanel.generatedTestTableName(item.name);
        const generateAuditLogName = `result${test_table}AuditLog`.trim().toLowerCase();
        const pack = await (0, helper_1.promisifyQuery)(tableExistenceQuery, [generateAuditLogName]);
        return pack[0]['ispresent'] === 1;
    }
    async createAuditUpdateTrigger(generatedTableName) {
        const auditLogTableName = `result${generatedTableName}AuditLog`.trim().toLowerCase();
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
        await (0, helper_1.promisifyQuery)(createUpdateTriggerQuery);
    }
    async createAuditDeleteTrigger(generatedTableName) {
        const auditLogTableName = `result${generatedTableName}AuditLog`.trim().toLowerCase();
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
        await (0, helper_1.promisifyQuery)(createDeleteTriggerQuery);
    }
    async createAuditTable(item) {
        const generatedTableName = list_1.testpanel.generatedTestTableName(item.name);
        const auditLogTableName = `result${generatedTableName}AuditLog`.trim().toLowerCase();
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
        await (0, helper_1.promisifyQuery)(createAuditLogTableQuery);
        await this.createAuditUpdateTrigger(generatedTableName);
        await this.createAuditDeleteTrigger(generatedTableName);
        console.log('Audit table creation successful \n');
    }
    async reconfiguringTableTriggers(item) {
        const test_table = list_1.testpanel.generatedTestTableName(item.name);
        const deleteTrigger = `trg_audit_log_delete_${test_table}`;
        const updateTrigger = `trg_audit_log_update_${test_table}`;
        const updateTriggerQuery = `SELECT COUNT(*) as count
                                    FROM information_schema.TRIGGERS
                                    WHERE TRIGGER_SCHEMA = 'limsdb'
                                    AND TRIGGER_NAME = '${updateTrigger}'`;
        const deleteTriggerQuery = `SELECT COUNT(*) as count
                                    FROM information_schema.TRIGGERS
                                    WHERE TRIGGER_SCHEMA = 'limsdb'
                                    AND TRIGGER_NAME = '${deleteTrigger}'`;
        const [has_update, has_delete] = await Promise.all([
            (0, helper_1.promisifyQuery)(updateTriggerQuery),
            (0, helper_1.promisifyQuery)(deleteTriggerQuery)
        ]);
        const hasAudit = await this.hasAuditTable(item);
        if (!hasAudit) {
            await this.createAuditTable(item);
        }
        if (has_delete[0]['count'] === 0) {
            await this.createAuditDeleteTrigger(test_table);
        }
        if (has_update[0]['count'] === 0) {
            await this.createAuditUpdateTrigger(test_table);
        }
    }
    async deleteTestResultTableTriggers(testTableTrigger) {
        let isDelTest = await this.deleteTestTriggers(testTableTrigger);
        let isDelUpdate = await this.deleteTestUpdateTrigger(testTableTrigger);
        return isDelTest && isDelUpdate;
    }
    async createTestResultTriggers(tablename) {
        await this.createAuditDeleteTrigger(tablename);
        await this.createAuditUpdateTrigger(tablename);
    }
    async getOldTables() {
        const testnamescollection = await (0, helper_1.promisifyQuery)(`SELECT name FROM test_panels`);
        console.log("################### Starting Reconfiguration #################");
        await Promise.all(testnamescollection.map(async (item) => {
            const newName = list_1.testpanel.generatedTestTableName(item.name);
            await this.alteringColumnNames('entrymode', newName);
            console.log("....................initiating reconfiguring of tables..................");
            await this.reconfigureTables(item.name);
            console.log("--------------------------reconfiguring table done ------------- ");
            console.log("initiating testtable indexing");
            await this.addingIndexToTable(item);
            console.log("Indexing on database tables successfully done");
            await this.reconfiguringTableTriggers(item);
            console.log('Reconfiguring audit and triggers done');
        }));
        console.log("################### Reconfiguration Successfully Done #################");
    }
}
exports.default = TableReconfiguration;
