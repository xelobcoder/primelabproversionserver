"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_load_from_organizationalBilling_Table = exports.q_load_to_organizationalBilling_Table = exports.q_organizationid_is_valid = exports.q_top_performance_organization = exports.q_updateOrg_payment_info = exports.q_org_contact = exports.q_org_payment = exports.q_update_organization_contact_info = exports.q_has_an_organization = exports.q_create_an_organization = exports.q_update_org_basic_info = exports.q_accountInfo = exports.YEARLYSALESQUERY = exports.TODAYSALESQUERY = exports.DAILYSALESQUERY = exports.WEEKLYSALESQUERY = exports.MONTHLYSALESQUERY = exports.INITQUERY = void 0;
exports.INITQUERY = `SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(*) AS referedCases FROM billing WHERE organization = ?`;
exports.MONTHLYSALESQUERY = `SELECT ${exports.INITQUERY} AND MONTH(billedon) = MONTH(CURRENT_DATE)`;
exports.WEEKLYSALESQUERY = `SELECT 
  CASE 
    WHEN DAY(billedon) > 0 AND DAY(billedon) < 7 THEN 'firstWeek'
    WHEN DAY(billedon) > 7 AND DAY(billedon) <= 14 THEN 'secondweek'
    WHEN DAY(billedon) > 14 AND DAY(billedon) <= 21 THEN 'thirdweek'
    ELSE 'fourthweek'
  END AS weeklySales,
  SUM(payable) AS payable,
  SUM(discount) AS discountedAmount,
  COUNT(billingid) AS referedCases 
  FROM billing WHERE organization = ? AND MONTH(billedon) = MONTH(CURRENT_DATE) GROUP BY weeklySales`;
exports.DAILYSALESQUERY = `SELECT DAY(billedon) AS day, ${exports.INITQUERY} AND YEAR(billedon) = YEAR(CURRENT_DATE) GROUP BY DAY(billedon)`;
exports.TODAYSALESQUERY = `SELECT ${exports.INITQUERY} AND DAY(billedon) = DAY(CURRENT_DATE)`;
exports.YEARLYSALESQUERY = `SELECT SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(billingid) AS referedCases, YEAR(billedon) AS yearlySales FROM billing WHERE organization = ? GROUP BY yearlySales`;
exports.q_accountInfo = "SELECT * FROM organizationaccountinformation WHERE organizationid = ?";
exports.q_update_org_basic_info = `UPDATE organization
              SET location = ?,
                  street = ?,
                  mobile = ?,
                  address = ?,
                  website = ?,
                  email = ?,
                  gpsmapping = ?,
                  region = ?,
                  name =?,
                  type= ?
              WHERE id = ?;
              `;
exports.q_create_an_organization = `INSERT INTO organization (name, location, street, mobile, address, website, email, gpsmapping, region,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
exports.q_has_an_organization = `SELECT COUNT(NAME) AS count FROM organization WHERE NAME = ?`;
exports.q_update_organization_contact_info = `UPDATE organizationcontactperson SET name = ? , email = ?, mobile = ? WHERE organizationid = ?`;
exports.q_org_payment = `SELECT * FROM organizationaccountinformation WHERE organizationid = ?`;
exports.q_org_contact = `SELECT * FROM organizationcontactperson WHERE organizationid = ?`;
exports.q_updateOrg_payment_info = `UPDATE organizationaccountinformation 
          SET
          branch = ?,
          commission = ?,
          account = ?,
          bankname = ?,
          module = ?,
          momoname = ?,
          accountname = ?,
          momo = ? 
          WHERE organizationid = ?`;
exports.q_top_performance_organization = ` SELECT DISTINCT o.ID AS id,
        o.name,
        oc.commission AS commissionRate,
        (  SELECT SUM(b.PAYABLE)
          WHERE o.id = o.id) AS totalSales,
        oc.commission / 100 * (
          SELECT SUM(b.PAYABLE)
          WHERE o.id = o.id
        ) AS commissionEarned,
        SUM(b.payable) AS TotalSales
    FROM organization AS o
        INNER JOIN billing AS b ON b.organization = o.id
        INNER JOIN organizationaccountinformation AS oc ON oc.organizationid = o.id`;
exports.q_organizationid_is_valid = `SELECT * FROM organization WHERE id = ?`;
exports.q_load_to_organizationalBilling_Table = `
INSERT INTO organizationalbillingtable (
  organizationid,
  testpricing,
  useCustomLetterHeadings,
  concessionValue,
  concessionMode,
  haveDifferentPriceList,
  hasConcessionAppliedAcross,
  createdby
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  testpricing = VALUES(testpricing),
  useCustomLetterHeadings = VALUES(useCustomLetterHeadings),
  concessionValue = VALUES(concessionValue),
  concessionMode = VALUES(concessionMode),
  haveDifferentPriceList = VALUES(haveDifferentPriceList),
  hasConcessionAppliedAcross = VALUES(hasConcessionAppliedAcross),
  createdby = VALUES(createdby);
`;
exports.q_load_from_organizationalBilling_Table = `SELECT * FROM organizationalBillingtable WHERE organizationid = ?`;
