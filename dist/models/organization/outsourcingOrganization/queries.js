"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.q_get_outsourceorganizationservices = exports.q_insert_into_outsource_org_services_table = exports.q_get_outsource_organization_basic = exports.q_outsource_organization_exist_usingid = exports.q_outsource_organization_exist = exports.q_update_an_outsource_organization_basic = exports.create_update_an_outsource_servicess = exports.q_create_an_outsource_organization = void 0;
exports.q_create_an_outsource_organization = `INSERT INTO outsourcingorganization(name, organizationType, email, address, billingAddress, contactNumber, contactPerson,  outsourceCreatedBy) VALUES (?,?,?,?,?,?,?,?)`;
exports.create_update_an_outsource_servicess = `INSERT INTO outsourcingServices(outsourceid, price,testid,addedon,addedby)`;
exports.q_update_an_outsource_organization_basic = ` 
    UPDATE outsourcingorganization 
    SET name  = ?, organizationType = ?, email = ?, address = ?, billingAddress = ?, contactNumber = ?, contactPerson =?, outsourceCreatedBy = ?
    WHERE outsourceid = ?`;
exports.q_outsource_organization_exist = `SELECT COUNT(*) AS count 
FROM outsourcingorganization 
WHERE name = ?;
`;
exports.q_outsource_organization_exist_usingid = `SELECT COUNT(*) AS count 
FROM outsourcingorganization 
WHERE outsourceid  = ?
`;
exports.q_get_outsource_organization_basic = `SELECT * FROM outsourcingorganization WHERE outsourceid  = ?`;
exports.q_insert_into_outsource_org_services_table = `INSERT INTO outsourceorganizationservices (
    outsourceid, 
    generalTestId, 
    outsourcePrice, 
    addedby
) VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
    outsourcePrice = VALUES(outsourcePrice),
    addedby = VALUES(addedby),
    updatedby=VALUES(addedby)
`;
exports.q_get_outsourceorganizationservices = `SELECT * FROM  outsourceorganizationservices WHERE outsourceid  = ?`;
