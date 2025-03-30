export const q_create_an_outsource_organization = `INSERT INTO outsourcingorganization(name, organizationType, email, address, billingAddress, contactNumber, contactPerson,  outsourceCreatedBy) VALUES (?,?,?,?,?,?,?,?)`


export const create_update_an_outsource_servicess = `INSERT INTO outsourcingServices(outsourceid, price,testid,addedon,addedby)`;


export const q_update_an_outsource_organization_basic = ` 
    UPDATE outsourcingorganization 
    SET name  = ?, organizationType = ?, email = ?, address = ?, billingAddress = ?, contactNumber = ?, contactPerson =?, outsourceCreatedBy = ?
    WHERE outsourceid = ?`;



export const q_outsource_organization_exist = `SELECT COUNT(*) AS count 
FROM outsourcingorganization 
WHERE name = ?;
`

export const q_outsource_organization_exist_usingid = `SELECT COUNT(*) AS count 
FROM outsourcingorganization 
WHERE outsourceid  = ?
`;

export const q_get_outsource_organization_basic = `SELECT * FROM outsourcingorganization WHERE outsourceid  = ?`;

export const q_insert_into_outsource_org_services_table = `INSERT INTO outsourceorganizationservices (
    outsourceid, 
    generalTestId, 
    outsourcePrice, 
    addedby
) VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    outsourcePrice = VALUES(outsourcePrice),
    addedby = VALUES(addedby),
    updatedby=VALUES(addedby)
`

export const q_get_outsourceorganizationservices = `SELECT * FROM  outsourceorganizationservices WHERE outsourceid  = ?`
 