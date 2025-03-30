import { testpanel } from '../../../dist/testpanel/list';
import { promisifyQuery } from "../../../helper";


interface QueryResult {
    [key: string]: any;
}

class TableReconfiguration {
    private async deleteTestTriggers(triggerName: string) {
        const delete_trigger = `DROP TRIGGER IF EXISTS  \`trg_audit_log_delete_${triggerName}\``;
        return await promisifyQuery(delete_trigger);
    }


    private async deleteTestUpdateTrigger(triggerName: string) {
        const delete_trigger = `DROP TRIGGER IF EXISTS  \`trg_audit_log_update_${triggerName}\``;
        return await promisifyQuery(delete_trigger)
    }

    private async alteringColumnNames(columnName: string, newName: string): Promise<void> {
        const q_checking_column_present = `SELECT COUNT(*) as count
                                           FROM information_schema.COLUMNS
                                           WHERE TABLE_SCHEMA = 'limsdb'
                                           AND TABLE_NAME = '${newName}'
                                           AND COLUMN_NAME = '${columnName}'`;

        const packet: QueryResult[] = await promisifyQuery(q_checking_column_present);
        const hasColumn = packet[0]['count'] === 1;

        if (!hasColumn) {
            const altering = `ALTER TABLE ${newName}
                              ADD COLUMN entrymode VARCHAR(20) DEFAULT 'manual';`;

            await promisifyQuery(altering);
            console.log('Column added successfully');
        }
    }

    private async reconfigureTables(name: string): Promise<string> {
        try {
            const newName = testpanel.generatedTestTableName(name);
            const oldName = `result${name.toString().replace(/ /g, "_")}`;
            const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                         FROM information_schema.tables
                                         WHERE table_schema = 'limsdb'
                                         AND table_name = ?`;

            async function rename(oldName: string, newName: string): Promise<void> {
                const altername = `RENAME TABLE ${oldName} TO ${newName}`;
                await promisifyQuery(altername);
            }

            const [isPresentOld, isPresentNew]: [QueryResult[], QueryResult[]] = await Promise.all([
                promisifyQuery(tableExistenceQuery, [oldName]),
                promisifyQuery(tableExistenceQuery, [newName])
            ]);

            const old_pr = isPresentOld[0]["ispresent"];
            const new_pr = isPresentNew[0]["ispresent"];
            console.table({ oldName, newName, old_pr, new_pr });

            if (old_pr === 0 && new_pr === 0) {
                await testpanel.createTestProcess(name);
                return newName;
            } else if (old_pr === 1 && new_pr === 0) {
                await rename(oldName, newName);
                return newName;
            } else {
                return newName;
            }
        } catch (err) {
            throw err;
        }
    }

    private async addingIndexToTable(item: { name: string }): Promise<void> {
        const test_table = testpanel.generatedTestTableName(item.name);
        const _checking_index = `SELECT COUNT(*) as count
                                 FROM information_schema.STATISTICS
                                 WHERE table_schema = 'limsdb'
                                 AND table_name = ?
                                 AND index_name = 'idx_billingid_patientid'`;

        const hasIndex: QueryResult[] = await promisifyQuery(_checking_index, [test_table]);
        const count = hasIndex[0]['count'];

        if (count === 0) {
            const addingIndex = `ALTER TABLE ?? ADD INDEX idx_billingid_patientid (billingid, patientid)`;
            await promisifyQuery(addingIndex, [test_table]);
        }
    }

    private async hasAuditTable(item: { name: string }): Promise<boolean> {
        const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                     FROM information_schema.tables
                                     WHERE table_schema = 'limsdb'
                                     AND table_name = ?`;
        const test_table = testpanel.generatedTestTableName(item.name);
        const generateAuditLogName = `result${test_table}AuditLog`.trim().toLowerCase();
        const pack: QueryResult[] = await promisifyQuery(tableExistenceQuery, [generateAuditLogName]);
        return pack[0]['ispresent'] === 1;
    }

    private async createAuditUpdateTrigger(generatedTableName: string): Promise<void> {
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

        await promisifyQuery(createUpdateTriggerQuery);
    }

    private async createAuditDeleteTrigger(generatedTableName: string): Promise<void> {
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

        await promisifyQuery(createDeleteTriggerQuery);
    }

    private async createAuditTable(item: { name: string }): Promise<void> {
        const generatedTableName = testpanel.generatedTestTableName(item.name);
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

        await promisifyQuery(createAuditLogTableQuery);
        await this.createAuditUpdateTrigger(generatedTableName);
        await this.createAuditDeleteTrigger(generatedTableName);
        console.log('Audit table creation successful \n');
    }

    private async reconfiguringTableTriggers(item: { name: string }): Promise<void> {
        const test_table = testpanel.generatedTestTableName(item.name);
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

        const [has_update, has_delete]: [QueryResult[], QueryResult[]] = await Promise.all([
            promisifyQuery(updateTriggerQuery),
            promisifyQuery(deleteTriggerQuery)
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

    public async deleteTestResultTableTriggers(testTableTrigger: string) {
        let isDelTest = await this.deleteTestTriggers(testTableTrigger);
        let isDelUpdate = await this.deleteTestUpdateTrigger(testTableTrigger);
        return isDelTest && isDelUpdate;
    }

    public async createTestResultTriggers(tablename: string) {
        await this.createAuditDeleteTrigger(tablename);
        await this.createAuditUpdateTrigger(tablename);
    }

    public async getOldTables(): Promise<void> {
        const testnamescollection: { name: string }[] = await promisifyQuery(`SELECT name FROM test_panels`);

        console.log("################### Starting Reconfiguration #################");
        await Promise.all(testnamescollection.map(async (item) => {
            const newName = testpanel.generatedTestTableName(item.name);

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

export default TableReconfiguration;
