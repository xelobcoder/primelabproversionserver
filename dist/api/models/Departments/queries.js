const q_pending_department_summary = `SELECT COUNT(hx.id) AS pending,hx.departmentid,d.department
    FROM departmentrequisition AS hx INNER JOIN departments AS d ON hx.departmentid = d.id WHERE quantity_approved IS NULL`;
const q_get_specific_dept_requisition_data = `SELECT  drh.id,
                        drh.departmentid, 
                        drh.stockid, 
                        drh.quantity_requested,
                        drh.quantity_approved,
                        drh.status,
                        drh.date,
                        drh.comsumptionunit,
                        d.department,ns.stockid,
                        ns.name,
                        ns.quantity
                        FROM departmentrequisition AS drh
              INNER JOIN departments AS d ON d.id = drh.departmentid
              INNER JOIN generalstocks AS ns ON ns.stockid = drh.stockid`;
const q_has_store_supplied_already = `SELECT store_supplied FROM departmentrequisition WHERE id = ?`;
const q_new_department_reqt = `INSERT INTO departmentrequisitionhx (productordersid, stockid, brandid, batchnumber, qty, requisitionid,departmentid,status)
    VALUES (?, ?, ?, ?, ?,?,?,?)`;
const q_new_Escrow_data = `
      INSERT INTO stocksEsrow (productordersid, stockid, brandid, batchnumber, qty, type,requisitionid,departmentid)
      VALUES (?, ?, ?, ?, ?, ?,?,?)
    `;
const q_escrow_order_exist = `SELECT COUNT(*) as count
      FROM stocksEsrow
      WHERE productordersid = ? AND stockid = ? AND brandid = ? AND batchnumber = ?
    `;
const q_delete_requit_from_escrow = `DELETE  FROM stocksesrow WHERE requisitionid = ?`;
const q_update_dept_requisition = `UPDATE departmentrequisition SET quantity_approved = ?,status = ?, approvedOn = NOW() WHERE  id = ?`;
const q_update_dept_requisition_after_supplied = `UPDATE departmentrequisition SET
                store_supplied = ?
                WHERE id = ?`;
const q_updateQtyDeptReceived = `UPDATE departmentrequisition 
       SET quantityReceived = ?, departmentReceived = ?, 
       status = ?, receivingemployee = ? WHERE id = ?`;
const q_do_dept_have_Stock_brand = `SELECT * FROM departmentsmainsupply WHERE stockid = ? AND brand = ? AND batchnumber = ? LIMIT 1`;
const q_get_dept_stock_brand = `SELECT * FROM departmentsmainsupply WHERE stockid = ? AND brand = ? AND batchnumber = ? LIMIT ?`;
const q_insertDeptMainStockSupply = `INSERT INTO departmentsmainsupply (quantity,
      stockid,brand,batchnumber,departmentid) VALUES(quantity,stockid,brand,batchnumber,departmentid)`;
const q_departmentsmainsupply = `UPDATE departmentsmainsupply SET 
      quantity = ? WHERE stockid = ? AND  brand = ? AND batchnumber = ?`;
const q_delete_requisition_query = `DELETE FROM departmentrequisition WHERE id = ?`;
const q_getDepartmentBrandBatch = `SELECT id,
              bt.batchnumber,
              bb.brand,
              bb.brandid,
              bt.departmentid,
              bt.quantity
      FROM departmentsmainsupply AS bt INNER JOIN stocksbrands AS bb ON bb.brandid = bt.brand
      WHERE bt.stockid = ? AND bt.departmentid = ?`;
const q_getDepartmentExpired = `
              SELECT 
              dm.stockid,
              sc.brand,
              dm.brand AS brandid,
              dm.quantity AS qtyAvailable,
              dm.batchnumber,
              gs.name,
              od.expirydate
          FROM 
              departmentsmainsupply AS dm
          INNER JOIN 
              orders AS od ON dm.stockid = od.stockid
          INNER JOIN 
              stocksbrands AS sc ON sc.brandid = dm.brand
          INNER JOIN 
              generalstocks AS gs ON gs.stockid = dm.stockid
          WHERE 
              od.stockid = dm.stockid 
              AND dm.batchnumber = od.batchnumber 
              AND dm.brand = od.brand 
              AND dm.expiredDisposed = 0 
              AND DATE(od.expirydate) < CURRENT_DATE
              AND dm.departmentid = ?
          GROUP BY 
    dm.batchnumber, dm.brand, dm.stockid, dm.quantity, gs.name, od.expirydate
`;
