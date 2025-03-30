ALTER TABLE `sampletype` CHANGE `id` `id` INT(255) NOT NULL AUTO_INCREMENT;

CREATE TABLE IF NOT EXISTS billingTransactionsOrders (
    orderid INT AUTO_INCREMENT,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    year INT DEFAULT YEAR(CURDATE()),
    month INT DEFAULT MONTH(CURDATE()),
    billingid INT,
    testid INT,
    amountDued DECIMAL(10,2),
    amountPaid DECIMAL(10,2),
    concession DECIMAL(10,2),
    addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_billingTransactionsOrders_billing
      FOREIGN KEY (billingid) REFERENCES billing(billingid)
      ON DELETE RESTRICT
      ON UPDATE CASCADE,
    CONSTRAINT fk_billingTransactionsOrders_tests
      FOREIGN KEY (testid) REFERENCES test_panel(testid)
      ON DELETE SET NULL
      ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS billingTransactionsOrders (
    orderid INT AUTO_INCREMENT,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    year INT DEFAULT YEAR(CURDATE()),
    month INT DEFAULT MONTH(CURDATE()),
    billingid INT,
    testid INT,
    amountDued DECIMAL(10,2),
    amountPaid DECIMAL(10,2),
    concession DECIMAL(10,2),
    addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (orderid),
    orderCreatedBy INT 
) ENGINE=InnoDB;





CREATE TABLE IF NOT EXISTS outsourcingOrganization (
    outsourceid INT AUTO_INCREMENT,
    name VARCHAR(100),
    organizationType ENUM('Hospitals','clinic','laboratory') DEFAULT 'laboratory',
    email VARCHAR(50),
    address VARCHAR(200),
    billingAddress VARCHAR(200),
    contactNumber INT(10),
    contactPerson VARCHAR(100),
    addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (outsourceid),
    outsourceCreatedBy  INT 
) ENGINE=InnoDB;




USE LIMSDB;
CREATE TABLE outSourceOrganizationServices(
    outserviceid INT AUTO_INCREMENT PRIMARY KEY,
    outsourceid INT(11),
    generalTestId INT ,
    outsourcePrice DECIMAL(7,2),
    addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     CONSTRAINT fk_outsource_organization_general
      FOREIGN KEY (generalTestId) REFERENCES limsdb.test_panels(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
       CONSTRAINT fk_outsource_service_organization_id
    FOREIGN KEY (outsourceid) REFERENCES limsdb.outsourcingOrganization(outsourceid) ON DELETE SET NULL ON UPDATE CASCADE
)



CREATE TABLE outSourceOrganizationContract(
    outsourceServiceId INT AUTO_INCREMENT PRIMARY KEY,
    startdate DATETIME DEFAULT NULL,
    enddate DATETIME DEFAULT NULL,
    outserviceid INT,
    billingTerms LONGTEXT,
    discount DECIMAL(7,2),
    addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
)

  CONSTRAINT fk_outsource_organization_id
    FOREIGN KEY (outserviceid) REFERENCES limsdb.outsourcingOrganization(outserviceid) ON DELETE SET NULL ON UPDATE CASCADE



   CREATE TABLE IF NOT EXISTS createOrganizationalSettings ( id INT AUTO_INCREMENT PRIMARY KEY, 
   testid INT, 
   organizationid INT, testpricing JSON DEFAULT "{}", 
   concessionMode ENUM('absolute','percentage') DEFAULT 'percentage', 
   concessionValue DECIMAL(10,2) DEFAULT 10.0, 
   useCustomLetterHeading BOOLEAN DEFAULT 0, 
   addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
   updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
   CONSTRAINT fk_organization_pricing_testid FOREIGN KEY(testid) REFERENCES limsdb.test_panels(id) ON DELETE CASCADE ON UPDATE CASCADE, 
   CONSTRAINT fk_organization_pricing_organization_map FOREIGN KEY(organizationid) REFERENCES limsdb.organization (id) ON UPDATE CASCADE ON DELETE CASCADE);


   -- method 2
      CREATE TABLE IF NOT EXISTS organizationalBillingTable ( 
      id INT AUTO_INCREMENT PRIMARY KEY, 
      organizationid INT, 
      testpricing JSON DEFAULT "{}", 
      useCustomLetterHeading BOOLEAN DEFAULT 0, 
      concessionValue INT,
      concessionMode ENUM('absolute','percentage','none') DEFAULT 'none',
      haveDifferentPriceList BOOLEAN DEFAULT 0,
      addedon DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedon DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
      CONSTRAINT fk_organization_pricing_organization_map FOREIGN KEY(organizationid) REFERENCES limsdb.organization (id) ON UPDATE CASCADE ON DELETE CASCADE);