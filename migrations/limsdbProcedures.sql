DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `DropPartitionIfExists`(IN tableName VARCHAR(255), IN partitionName VARCHAR(255))
BEGIN
    DECLARE partitionCount INT;
    SET @query = CONCAT('SELECT COUNT(*) INTO @partitionCount FROM information_schema.partitions WHERE table_schema = DATABASE() AND table_name = "', tableName, '" AND partition_name = "', partitionName, '"');
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    IF @partitionCount > 0 THEN
        SET @dropQuery = CONCAT('ALTER TABLE ', tableName, ' DROP PARTITION ', partitionName);
        PREPARE dropStmt FROM @dropQuery;
        EXECUTE dropStmt;
        DEALLOCATE PREPARE dropStmt;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `createAuditTestLogTable`(IN `auditLogTableName` VARCHAR(255))
BEGIN
    SET @sql = CONCAT('CREATE TABLE ', auditLogTableName, ' (
        id INT PRIMARY KEY AUTO_INCREMENT,
        FIELD VARCHAR(100),
        billingid INT,
        patientid BIGINT,
        previousValue VARCHAR(60),
        employeeid INT,
        fieldid INT,
        entrymode VARCHAR(20) DEFAULT ''manual'',
        created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP
    )');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `createResultDeleteTrigger`(
    IN generatedTableName VARCHAR(255),
    IN auditLogTableName VARCHAR(255)
)
BEGIN
    DECLARE createDeleteTriggerQuery TEXT;
    
    SET @createDeleteTriggerQuery = CONCAT('
        CREATE TRIGGER `trg_audit_log_delete_', generatedTableName, '`
        AFTER DELETE ON `', generatedTableName, '`
        FOR EACH ROW
        BEGIN
            INSERT INTO `', auditLogTableName, '` (
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
        END
    ');

    PREPARE stmt FROM @createDeleteTriggerQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `createResultTable`(IN `tablename` VARCHAR(255))
BEGIN
SET @PI = CONCAT('CREATE TABLE ', tablename,' (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            value VARCHAR(60),
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP,
            updatedon DATETIME(6) DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            employeeid INT,
            entrymode VARCHAR(20) DEFAULT "manual",
            INDEX idx_billingid_patientid (billingid, patientid)
        )');
        PREPARE stmt FROM @PI;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `createResultUpdateTrigger`(IN `generatedTableName` VARCHAR(255), IN `auditLogTableName` VARCHAR(255))
BEGIN
    DECLARE createUpdateTriggerQuery TEXT;
    
    SET @createUpdateTriggerQuery = CONCAT('
        CREATE TRIGGER `trg_audit_log_update_', generatedTableName, '`
        AFTER UPDATE ON `', generatedTableName, '`
        FOR EACH ROW
        BEGIN
            INSERT INTO `', auditLogTableName, '` (
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
        END
    ');

    PREPARE stmt FROM @createUpdateTriggerQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_tables_and_triggers`(
    IN generatedTableName VARCHAR(255),
    IN generatedAuditLogTableName VARCHAR(255)
)
BEGIN
    DECLARE exit handler for SQLEXCEPTION
    BEGIN
        -- Rollback changes if an error occurs
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An error occurred during table and trigger creation.';
    END;

    START TRANSACTION;

    -- Create generated table
    SET @createGeneratedTable = CONCAT(
        'CREATE TABLE IF NOT EXISTS `', generatedTableName, '` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            value VARCHAR(60),
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            employeeid INT,
            entrymode VARCHAR(20) DEFAULT \'manual\',
            INDEX idx_billingid_patientid (billingid, patientid)
        )'
    );

    PREPARE stmt1 FROM @createGeneratedTable;
    EXECUTE stmt1;
    DEALLOCATE PREPARE stmt1;

    -- Create audit log table
    SET @createAuditLogTable = CONCAT(
        'CREATE TABLE IF NOT EXISTS `', generatedAuditLogTableName, '` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            field VARCHAR(100),
            billingid INT,
            patientid BIGINT,
            previousValue VARCHAR(60),
            employeeid INT,
            fieldid INT,
            entrymode VARCHAR(20) DEFAULT \'manual\',
            created_on DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
        )'
    );

    PREPARE stmt2 FROM @createAuditLogTable;
    EXECUTE stmt2;
    DEALLOCATE PREPARE stmt2;

    -- Commit creation of tables
    COMMIT;

    -- Start new transaction for triggers creation
    START TRANSACTION;

    -- Create update trigger
    SET @createUpdateTrigger = CONCAT(
        'CREATE TRIGGER IF NOT EXISTS trg_audit_log_update_', generatedTableName, '
        AFTER UPDATE ON ', generatedTableName, '
        FOR EACH ROW
        BEGIN
            INSERT INTO ', generatedAuditLogTableName, ' (
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

    PREPARE stmt3 FROM @createUpdateTrigger;
    EXECUTE stmt3;
    DEALLOCATE PREPARE stmt3;

    -- Create delete trigger
    SET @createDeleteTrigger = CONCAT(
        'CREATE TRIGGER IF NOT EXISTS trg_audit_log_delete_', generatedTableName, '
        AFTER DELETE ON ', generatedTableName, '
        FOR EACH ROW
        BEGIN
            INSERT INTO ', generatedAuditLogTableName, ' (
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

    PREPARE stmt4 FROM @createDeleteTrigger;
    EXECUTE stmt4;
    DEALLOCATE PREPARE stmt4;

    -- Commit triggers creation
    COMMIT;

    SELECT 'Tables and triggers created successfully.' AS Message;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `drop_table_and_clean_audit`(
    IN tableName VARCHAR(255),
    IN auditLogTableName VARCHAR(255)
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Handle exceptions, if any
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET @stmt1 = CONCAT('DROP TABLE IF EXISTS `', tableName, '`');
    SET @stmt2 = CONCAT('DROP TABLE IF EXISTS `', auditLogTableName, '`');

    PREPARE stmt1 FROM @stmt1;
    PREPARE stmt2 FROM @stmt2;

    EXECUTE stmt2;
    EXECUTE stmt1;

    DEALLOCATE PREPARE stmt1;
    DEALLOCATE PREPARE stmt2;

    COMMIT;
END$$
DELIMITER ;
