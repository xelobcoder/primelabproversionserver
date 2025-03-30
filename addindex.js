// const testpanel = require("./api/testpanel/list");
// const { promisifyQuery } = require("./helper");

// const AddForeignKey = async function () {
//      try {
//           const q = `
//             SELECT name FROM test_panels;
//         `;

//           const result = await promisifyQuery(q);

//           for (let i = 0; i < result.length; i++) {
//                const testname = result[i]['name']
//                const tableName = `result${testpanel.generateTableName(testname)}`.trim();

//                if (["resulthelicobacter_pylori__stool", "resulthvs_re", "resultprops(adult)genesis","resulturine_re"].includes(tableName.toLowerCase())) {
//                    await promisifyQuery(`DELETE FROM TEST_PANELS WHERE NAME = ?`,[tableName])
//                }
//                else {
//                     await promisifyQuery(`ALTER TABLE \`${tableName}\` MODIFY COLUMN patientid BIGINT`);
//                }
//                await promisifyQuery(`ALTER TABLE new_patients MODIFY COLUMN patientid BIGINT`);

//                     const alterQuery = `
//                      ALTER TABLE \`${tableName}\`
//                      ADD CONSTRAINT fk_${tableName}_patientid
//                      FOREIGN KEY (patientid) REFERENCES new_patients(patientid)
//                      ON DELETE CASCADE
//                  `;
//                     const status = await promisifyQuery(alterQuery);
//                     console.log(status)
//                     console.log(`Foreign key added for table ${tableName}`);
//           }

//           console.log("All tables processed successfully.");
//      } catch (err) {
//           if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_KEY_COLUMN_DOES_NOT_EXIST') {
//                console.log("Duplicate key name or key column does not exist.");
//           } else {
//                console.error(err);
//           }
//      }
// };

// // Call the function to add foreign key constraints to tables
// AddForeignKey();




// // patientid, billing, employeeid,updateon, value,


`CREATE TABLE result_liver_function_test_audit_log (
   auditid INT (255) AUTO_INCREMENT,
   billingid: INT (255),
   patientid: BIG INT(255),
   field: VARCHAR(50),
   previousValue: VARCHAR(50),
   currentValue: VARCHAR(50),
   modified_by: INT(50),
   modified_at: DATETIME CURRENT_TIMESTAMP
)
`


