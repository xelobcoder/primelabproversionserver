"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_get_all_result_entry_partitioning = exports.q_get_all_result_entry_base = void 0;
const helper_1 = require("../../../helper");
const partitioning_1 = __importDefault(require("../billing/partitioning"));
exports.q_get_all_result_entry_base = `
  SELECT 
    CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
    CONCAT(np.age, " ", np.agetype) AS age,
    np.patientid,
    b.billingid,
    tp.category,
    d.department,
    tp.name,
    b.clinician,
    ss.approvalstatus,
    ta.ready,
    ta.processing,
    tp.id,
    b.clientstatus,
    CASE WHEN b.organization <> 0 THEN
      (SELECT name FROM organization WHERE id = b.organization)
    END AS organization,
    CASE WHEN b.clinician <> 0 THEN
      (SELECT name FROM clinicianbasicinfo WHERE id = b.clinician)
    END AS clinicianName
  FROM new_patients AS np
  INNER JOIN {billing_table} AS b ON np.patientid = b.patientid
  INNER JOIN {asc_table} AS ta ON ta.billingid = b.billingid
  INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
  INNER JOIN test_panels AS tp ON tp.id = ss.testid
  INNER JOIN departments AS d ON d.id = tp.category
  WHERE ss.approvalstatus = 1
    AND ta.collection = 'true'
    AND d.department <> 'ultrasound'
`;
exports.q_get_all_result_entry_partitioning = `SELECT 
    CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) AS fullname,
    CONCAT(np.age, " ", np.agetype) AS age,
    np.patientid,
    b.billingid,
    tp.category,
    d.department,
    tp.name,
    b.clinician,
    ss.approvalstatus,
    ta.ready,
    ta.processing,
    tp.id,
    b.clientstatus,
    CASE WHEN b.organization <> 0 THEN
      (SELECT name FROM organization WHERE id = b.organization)
    END AS organization,
    CASE WHEN b.clinician <> 0 THEN
      (SELECT name FROM clinicianbasicinfo WHERE id = b.clinician)
    END AS clinicianName
  FROM new_patients AS np
  INNER JOIN (
    SELECT * FROM billing PARTITION ({billing_table})
  ) AS b ON np.patientid = b.patientid
  INNER JOIN (
    SELECT * FROM test_ascension PARTITION ({asc_table})
  ) AS ta ON ta.billingid = b.billingid
  INNER JOIN samplestatus AS ss ON ss.ascensionid = ta.id
  INNER JOIN test_panels AS tp ON tp.id = ss.testid
  INNER JOIN departments AS d ON d.id = tp.category
  WHERE ss.approvalstatus = 1
    AND ta.collection = 'true'
    AND d.department <> 'ultrasound'

`;
async function getAllCasesResultEntryByMany(requestQuery) {
    const { fullname, count = 10, page = 1, departmentid, testid, status, from, to } = requestQuery;
    try {
        let queries = [];
        let finalQuery;
        const values = [];
        const conditions = [];
        const hasDuration = from && to;
        const providedFrom = new Date(new Date(from));
        const providedTo = new Date(new Date(to));
        const hasSameMonth = providedFrom.getMonth() === providedTo.getMonth();
        const hasSameYear = providedFrom.getFullYear() === providedTo.getFullYear();
        function getPartitionTableName(baseName, currentDate = new Date()) {
            const year = currentDate.getFullYear();
            const month = `${currentDate.getMonth() + 1}`.padStart(2, "0");
            return `${baseName}_${year}_${month}`;
        }
        if (hasDuration && !(hasSameMonth && hasSameYear)) {
            let billingPartitions = await new partitioning_1.default("billing", "billing").TablePartitionPrunner(from, to);
            let testAscensionsPartions = await new partitioning_1.default("test_ascension", "asc").TablePartitionPrunner(from, to);
            const canMove = typeof billingPartitions === "string" && typeof testAscensionsPartions === "string";
            if (canMove) {
                const query = exports.q_get_all_result_entry_partitioning
                    .replace("{billing_table}", billingPartitions)
                    .replace("{asc_table}", testAscensionsPartions);
                finalQuery = query;
            }
            else {
                finalQuery = exports.q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
            }
        }
        else if (hasDuration && hasSameMonth && hasSameYear) {
            const billingTable = getPartitionTableName("billing");
            const ascTable = getPartitionTableName("asc");
            const query = exports.q_get_all_result_entry_partitioning.replace("{billing_table}", billingTable).replace("{asc_table}", ascTable);
            finalQuery = query;
        }
        else {
            finalQuery = exports.q_get_all_result_entry_base.replace("{billing_table}", "billing").replace("{asc_table}", "test_ascension");
        }
        if (fullname) {
            conditions.push(`CONCAT(np.firstname, ' ', np.middlename, ' ', np.lastname) LIKE ?`);
            values.push(`${fullname}%`);
        }
        if (departmentid && departmentid !== "all") {
            conditions.push(`tp.category = ?`);
            values.push(departmentid);
        }
        if (status === "completed") {
            conditions.push(`ta.ready = 'true'`);
        }
        else if (status === "pending") {
            conditions.push(`ta.ready = 'false'`);
        }
        if (testid && !isNaN(testid)) {
            conditions.push(`ta.testid = ?`);
            values.push(testid);
        }
        if (from && to) {
            conditions.push(`DATE(b.billedon) BETWEEN ? AND ?`);
            values.push(from, to);
        }
        else if (from) {
            conditions.push(`DATE(b.billedon) BETWEEN ? AND CURRENT_DATE`);
            values.push(from);
        }
        if (conditions.length > 0) {
            finalQuery += ` AND ${conditions.join(" AND ")} `;
        }
        finalQuery += `
      ORDER BY billingid DESC
      LIMIT ? OFFSET ?
    `;
        return await (0, helper_1.paginationQuery)({ count, page }, finalQuery, values);
    }
    catch (err) {
        throw err;
    }
}
exports.default = getAllCasesResultEntryByMany;
// // Example of how paginationQuery might be defined
// async function paginationQuery(pagination: { count: number; page: number }, query: string, values: any[]): Promise<any[]> {
//   // Your implementation here to run the query with pagination
//   // This is just a placeholder example
//   return [];
// }
