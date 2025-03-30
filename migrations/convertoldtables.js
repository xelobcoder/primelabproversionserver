const { testpanel } = require("./../dist/testpanel/list");
const { promisifyQuery } = require("../helper");

async function getOldTables() {
       const testnamescollection = await promisifyQuery(`SELECT name FROM test_panels`);

       // testnamescollection.map(async (item, index) => {
       //        try {
       //               let newName = testpanel.generatedTestTableName(item.name)
       //               const generateAuditLogName = `result${newName}AuditLog`.trim().toLowerCase();
       //               const up = `DROP TRIGGER IF EXISTS  \`trg_audit_log_update_${newName}\``;
       //               const down = `DROP TRIGGER IF EXISTS  \`trg_audit_log_delete_${newName}\``;
       //               const mysql = `DROP TABLE \`${generateAuditLogName}\``;

       //               // const t = await promisifyQuery(mysql);
       //               const v = await promisifyQuery(up);
       //               const u = await promisifyQuery(down);
       //               console.log(generateAuditLogName)
       //        } catch (err) {
       //               console.log(err)
       //        }
       // })
       console.log("################### Starting Reconfiguration #################");
       await Promise.all(testnamescollection.map(async (item, index) => {
              let newName = testpanel.generatedTestTableName(item.name);

              async function AlteringColumnNames(columnName) {
                     const q_checking_column_present = `SELECT COUNT(*) as count
                                               FROM information_schema.COLUMNS
                                               WHERE TABLE_SCHEMA = 'limsdb'
                                               AND TABLE_NAME = '${newName}'
                                               AND COLUMN_NAME = '${columnName}'`;


                     const packet = await promisifyQuery(q_checking_column_present);

                     const hasColumn = packet[0]['count'] === 1;

                     if (!hasColumn) {
                            const altering = `ALTER TABLE ${newName}
       ADD COLUMN entrymode VARCHAR(20) DEFAULT 'manual';
       `

                            const addColumn = await promisifyQuery(altering);

                            console.log(addColumn, 'column added successfully');
                     }
              }







              async function reconfigureTables(name) {
                     try {
                            let newName = testpanel.generatedTestTableName(name);
                            let oldName = `result${name.toString().replaceAll(" ", "_")}`;
                            const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                                         FROM information_schema.tables
                                                         WHERE table_schema = 'limsdb'
                                                         AND table_name = ?`;


                            async function rename(oldName, newName) {
                                   const altername = `RENAME TABLE ${oldName} TO ${newName}`;
                                   // await promisifyQuery(altername);
                            }

                            let isPresentOld = await promisifyQuery(tableExistenceQuery, [oldName]);
                            let isPresntNew = await promisifyQuery(tableExistenceQuery, [newName]);


                            let old_pr = isPresentOld[0]["ispresent"];
                            let new_pr = isPresntNew[0]["ispresent"];
                            console.table({ oldName, newName, old_pr, new_pr })
                            if (old_pr === 0 && new_pr === 0) {
                                   const outcome = await testpanel.createTestProcess(name);
                                   return outcome;
                            } else if (old_pr == 1 && new_pr === 0) {
                                   rename(oldName, newName);
                                   return newName;
                            } else {
                                   return newName;
                            }




                     } catch (err) {
                            console.log(err);
                     }
              }



              async function addingIndexToTable() {
                     const test_table = testpanel.generatedTestTableName(item.name);

                     const _checking_index = `SELECT COUNT(*) as count
                                               FROM information_schema.STATISTICS
                                               WHERE table_schema = 'limsdb'
                                               AND table_name = ?
                                               AND index_name = 'idx_billingid_patientid'
       `
                     const hasIndex = await promisifyQuery(_checking_index, [test_table]);
                     const count = hasIndex[0]['count'];

                     if (count === 0) {
                            const addingIndex = `ALTER TABLE ?? ADD INDEX idx_billingid_patientid (billingid, patientid)`;
                            await promisifyQuery(addingIndex, [test_table]);
                     }

              }




              async function hasAuditTable(item) {
                     const tableExistenceQuery = `SELECT COUNT(*) AS ispresent
                                                         FROM information_schema.tables
                                                         WHERE table_schema = 'limsdb'
                                                         AND table_name = ?`;
                     const test_table = testpanel.generatedTestTableName(item.name);
                     const generateAuditLogName = `result${test_table}AuditLog`.trim().toLowerCase();
                     const pack = await promisifyQuery(tableExistenceQuery, [generateAuditLogName]);
                     return pack[0]['ispresent'] === 1;
              }




              async function createAuditUpdateTrigger(generatedTableName) {
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
                     console.log("audit update trigger done");
              }




              async function createAuditDeleteTrigger(generatedTableName) {
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
                     console.log("audit delete trigger done");

              }



              async function createAuditTable(item) {
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
                     await createAuditUpdateTrigger(generatedTableName);
                     await createAuditDeleteTrigger(generatedTableName);
                     console.log('audit table creation successful \n');
              }




              async function reconfiguringTableTriggers(item) {
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

                     let has_update = await promisifyQuery(updateTriggerQuery);
                     let has_delete = await promisifyQuery(deleteTriggerQuery);



                     has_update = has_update[0]['count'];
                     has_delete = has_delete[0]['count'];

                     const hasAudit = await hasAuditTable(item);
                     console.log(hasAudit, hasAudit, has_delete, has_update)
                     if (!hasAudit) {
                            return await createAuditTable(item)
                     }


                     if (has_delete === 0) {
                            await createAuditDeleteTrigger(test_table);

                     }

                     if (!has_update === 0) {
                            await createAuditUpdateTrigger(test_table);
                     }

              }



              await AlteringColumnNames('entrymode');
              console.log("....................initiating reconfiguring of tables..................")
              reconfigureTables(item['name']);
              console.log("--------------------------reconfiguring table done ------------- ");
              console.log("initiating testtable indexing");
              await addingIndexToTable();
              console.log("Indexing on database tables successfully done");
              await reconfiguringTableTriggers(item);
              console.log('reconfiguring audit and triggers done');

       }));

       console.log("################### Reconfiguration Successfully Done #################");
}


module.exports = getOldTables;