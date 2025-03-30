export const INITQUERY = `SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(*) AS referedCases FROM billing WHERE organization = ?`;

export const MONTHLYSALESQUERY = `SELECT ${INITQUERY} AND MONTH(billedon) = MONTH(CURRENT_DATE)`;

export const WEEKLYSALESQUERY = `SELECT 
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

export const DAILYSALESQUERY = `SELECT DAY(billedon) AS day, ${INITQUERY} AND YEAR(billedon) = YEAR(CURRENT_DATE) GROUP BY DAY(billedon)`;

export const TODAYSALESQUERY = `SELECT ${INITQUERY} AND DAY(billedon) = DAY(CURRENT_DATE)`;

export const YEARLYSALESQUERY = `SELECT SUM(payable) AS payable, SUM(discount) AS discountedAmount, COUNT(billingid) AS referedCases, YEAR(billedon) AS yearlySales FROM billing WHERE organization = ? GROUP BY yearlySales`;

export const q_accountInfo = "SELECT * FROM organizationaccountinformation WHERE organizationid = ?";


export const q_update_org_basic_info = `UPDATE organization
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
              `


export const q_create_an_organization = `INSERT INTO organization (name, location, street, mobile, address, website, email, gpsmapping, region,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`


export const q_has_an_organization = `SELECT COUNT(NAME) AS count FROM organization WHERE NAME = ?`


export const q_update_organization_contact_info = `UPDATE organizationcontactperson SET name = ? , email = ?, mobile = ? WHERE organizationid = ?`



export const q_org_payment = `SELECT * FROM organizationaccountinformation WHERE organizationid = ?`


export const q_org_contact = `SELECT * FROM organizationcontactperson WHERE organizationid = ?`


export const q_updateOrg_payment_info = `UPDATE organizationaccountinformation 
          SET
          branch = ?,
          commission = ?,
          account = ?,
          bankname = ?,
          module = ?,
          momoname = ?,
          accountname = ?,
          momo = ? 
          WHERE organizationid = ?`



export const q_top_performance_organization = ` SELECT DISTINCT o.ID AS id,
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
        INNER JOIN organizationaccountinformation AS oc ON oc.organizationid = o.id`


export const q_organizationid_is_valid = `SELECT * FROM organization WHERE id = ?`;


export const q_load_to_organizationalBilling_Table = `
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



export const q_load_from_organizationalBilling_Table = `SELECT * FROM organizationalBillingtable WHERE organizationid = ?`