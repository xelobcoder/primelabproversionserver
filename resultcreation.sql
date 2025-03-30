CREATE TABLE IF NOT EXIST countMonitoring(
          id INT PRIMARY_KEY AUTO_INCREMENT,
          tBillingCount INT, 
          pPatientCount INT,
          lastPatientid INT,
          
)

DELIMITER //

CREATE PROCEDURE `create_tables_and_triggers` (
    IN generatedTableName VARCHAR(255),
    IN generatedAuditLogTableName VARCHAR(255)
)
BEGIN
    SET @createGeneratedTable = CONCAT(
        'CREATE TABLE `', generatedTableName, '` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            value VARCHAR(60),
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP,
            updated_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            employeeid INT,
            entrymode VARCHAR(20) DEFAULT ''manual'',
            INDEX idx_billingid_patientid (billingid, patientid)
        )'
    );
    
    SET @createAuditLogTable = CONCAT(
        'CREATE TABLE `', generatedAuditLogTableName, '` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            previousValue VARCHAR(60),
            employeeid INT,
            fieldid INT,
            entrymode VARCHAR(20) DEFAULT ''manual'',
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP
        )'
    );
    
    SET @createUpdateTrigger = CONCAT(
        'CREATE TRIGGER `trg_audit_log_update_', generatedTableName, '`
        AFTER UPDATE ON `', generatedTableName, '`
        FOR EACH ROW
        BEGIN
            INSERT INTO `', generatedAuditLogTableName, '` (
                previousValue,
                billingid,
                patientid,
                fieldid,
                employeeid,
                entrymode
            ) VALUES (
                OLD.value,
                OLD.billingid,
                OLD.patientid,
                OLD.id,
                OLD.employeeid,
                OLD.entrymode
            );
        END'
    );
    
    SET @createDeleteTrigger = CONCAT(
        'CREATE TRIGGER `trg_audit_log_delete_', generatedTableName, '`
        AFTER DELETE ON `', generatedTableName, '`
        FOR EACH ROW
        BEGIN
            INSERT INTO `', generatedAuditLogTableName, '` (
                previousValue,
                billingid,
                patientid,
                fieldid,
                employeeid,
                entrymode
            ) VALUES (
                OLD.value,
                OLD.billingid,
                OLD.patientid,
                OLD.id,
                OLD.employeeid,
                OLD.entrymode
            );
        END'
    );
    
    PREPARE stmt1 FROM @createGeneratedTable;
    PREPARE stmt2 FROM @createAuditLogTable;
    PREPARE stmt3 FROM @createUpdateTrigger;
    PREPARE stmt4 FROM @createDeleteTrigger;
    
    EXECUTE stmt1;
    EXECUTE stmt2;
    EXECUTE stmt3;
    EXECUTE stmt4;
    
    DEALLOCATE PREPARE stmt1;
    DEALLOCATE PREPARE stmt2;
    DEALLOCATE PREPARE stmt3;
    DEALLOCATE PREPARE stmt4;
END //

CREATE PROCEDURE `drop_table_and_clean_audit` (
    IN tableName VARCHAR(255),
    IN auditLogTableName VARCHAR(255)
)
BEGIN
    SET @stmt1 = CONCAT('DROP TABLE IF EXISTS `', tableName, '`');
    SET @stmt2 = CONCAT('DROP TABLE IF EXISTS `', auditLogTableName, '`');
    
    PREPARE stmt1 FROM @stmt1;
    PREPARE stmt2 FROM @stmt2;
    
    EXECUTE stmt2;
    EXECUTE stmt1;
    
    DEALLOCATE PREPARE stmt1;
    DEALLOCATE PREPARE stmt2;
END //

DELIMITER ;


const generatedTableName = `result${this.generateTableName(testname)}`.trim();
        const auditLogTableName = `result${generatedTableName}AuditLog`.trim();

        const createTestTableQuery = `CALL createResultTable (?)`;
        const createAuditLogTableQuery = `CALL createAuditTestLogTable (?)`;
        const createUpdateTriggerQuery = `CALL createResultUpdateTrigger	(?,?)`;
        const createDeleteTriggerQuery = `CALL createResultDeleteTrigger (?,?)`;
        await promisifyQuery(createTestTableQuery, [generatedTableName]);
        await promisifyQuery(createAuditLogTableQuery, [auditLogTableName]);
        await promisifyQuery(createUpdateTriggerQuery, [generatedTableName, auditLogTableName]);
        await promisifyQuery(createDeleteTriggerQuery, [generatedTableName, auditLogTableName]);
        return true;