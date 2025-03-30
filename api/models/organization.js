const { promisifyQuery, customError, paginationQuery, responseError, rowAffected } = require("../../helper")
const logger = require("../../logger")
const connection = require("../db")

let o = {}

o.getOrganizations = (req, res) => {
  let query = "SELECT id,name FROM organization"
  // execute query
  connection.query(query, (err, result) => {
    if (err) {
      logger.error(err)
    }
    res.send({ statusCode: 200, result })
  })
}

o.getOrganizationWithDetails = async function (request, response) {
  try {
    const { page, count, organization, email, contact } = request.query
    if (!page || !count) {
      return customError(`page and count must be in query`, 404, response)
    }
    let query = `SELECT * FROM organization`
    const vals = []

    if (organization) {
      const hasWhere = query.includes(`WHERE`)
      if (hasWhere) {
        query += ` AND name LIKE ?`
      } else {
        query += ` WHERE name LIKE ?`
      }
      vals.push(`%${organization}%`)
    }

    if (email) {
      const hasWhere = query.includes(`WHERE`)
      if (hasWhere) {
        query += ` AND email LIKE ?`
      } else {
        query += ` WHERE email LIKE ?`
      }
      vals.push(`%${email}%`)
    }
    if (contact) {
      const hasWhere = query.includes(`WHERE`)
      if (hasWhere) {
        query += ` AND mobile = ?`
      } else {
        query += ` WHERE mobile = ?`
      }
      vals.push(parseInt(contact))
    }
    query += ` LIMIT ? OFFSET ?`
    const result = await paginationQuery({ page, count }, query, vals)
    response.send({ statusCode: 200, result, status: "success" })
  } catch (err) {
    responseError(response)
  }
}

o.getOrganizationsBasic = async function (request, response) {
  const { id } = request.query
  if (!id) {
    customError(`organizationid required`, 404, response)
  } else {
    let result = await promisifyQuery(`SELECT * FROM organization WHERE id = ?`, id)
    response.send({ statusCode: 200, status: "success", result })
  }
}

o.isOrgnizationExistUsingName = function (name) {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(NAME) AS NUMBER FROM organization WHERE NAME = ?`
    connection.query(query, name, function (err, result) {
      if (err) {
        reject(err)
      } else {
        resolve(result[0]["NUMBER"] > 0 ? true : false)
      }
    })
  })
}

o.checkOrganizationExistUsingId = async function (id) {
  const query = `SELECT * FROM organization WHERE id = ?`
  try {
    const result = await promisifyQuery(query, id)
    return result.length > 0 ? true : false
  } catch (err) {
    logger.error(err)
  }
}

o.createAOrganization = async function (request, response) {
  const { name, location, street, mobile, address, website, email, gpsMapping, region } = request.body

  const query = `INSERT INTO organization (name, location, street, mobile, address, website, email, gpsmapping, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

  const values = [name, location, street, mobile, address, website, email, gpsMapping, region]

  const available = await this.isOrgnizationExistUsingName(name)
  if (available) {
    response.send({
      statusCode: 201,
      status: "exist",
      message: "Organization with the same name already exists",
    })
  } else {
    connection.query(query, values, function (err, result) {
      if (err) {
        console.log(err)
        logger.error(err)
      }
      if (result) {
        result.affectedRows === 1
          ? response.send({
              statusCode: 201,
              organizationId: result.insertId,
              status: "success",
              message: "New organization created successfully",
            })
          : response.send({ statusCode: 401, message: "No insertion done" })
      }
    })
  }
}

o.updateOrganizationBasic = async function (request, response) {
  const { name, location, street, mobile, address, website, email, gpsMapping, region, id } = request.body

  const query = `UPDATE organization
              SET location = ?,
                  street = ?,
                  mobile = ?,
                  address = ?,
                  website = ?,
                  email = ?,
                  gpsmapping = ?,
                  region = ?,
                  name =?
              WHERE id = ?;
              `

  const values = [location, street, mobile, address, website, email, gpsMapping, region, name, parseInt(id)]

  connection.query(query, values, function (err, result) {
    if (err) {
      logger.error(err)
    }
    if (result) {
      result.affectedRows == 1
        ? response.send({ statusCode: 200, message: "organization updated successfully", status: "success" })
        : response.send({ statusCode: 401, message: "No update done" })
    }
  })
}

o.getOrganizationsContact = async function (request, response) {
  const { id } = request.query
  if (id) {
    try {
      let result = await promisifyQuery(`SELECT * FROM organizationcontactperson WHERE organizationid = ?`, id)
      response.send({ statusCode: 200, status: "success", result })
    } catch (err) {
      logger.error(err)
    }
  } else {
    customError(`organizatonid required`, 404, response)
  }
}

o.getOrganizationsPayment = async function (request, response) {
  const { id } = request.query
  if (id) {
    try {
      let result = await promisifyQuery(`SELECT * FROM organizationaccountinformation WHERE organizationid = ?`, id)
      response.send({ statusCode: 200, status: "success", result })
    } catch (err) {
      logger.error(err)
    }
  } else {
    customError(`organizatonid required`, 404, response)
  }
}

o.updateOrganizationContact = async function (request, response) {
  const { name, email, mobile, organizationid } = request.body
  const query = `UPDATE organizationcontactperson SET name = ? , email = ?, mobile = ? WHERE organizationid = ?`
  try {
    let result = await promisifyQuery(query, [name, email, mobile, organizationid])
    const { affectedRows } = result
    response.send({
      statusCode: 200,
      status: "success",
      message: parseInt(affectedRows) === 1 ? "infomation updated succesfully" : "No updates were made",
    })
  } catch (err) {
    logger.error(err)
    customError(`error occured`, 500, response)
  }
}

o.updateOrganizationPayment = async function (request, response) {
  const { bankname, momoname, branch, module, commission, organizationid, id, account, accountname, momo } = request.body

  const query = `UPDATE organizationaccountinformation 
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

  const values = [branch, commission, account, bankname, module, momoname, accountname, momo, parseInt(organizationid)]
  try {
    let result = rowAffected(await promisifyQuery(query, values));
    if (result) {
      response.send({ statusCode: 200, status: "success", message: "update successful" })
    } else {
      response.send({ message: "update failed", status: "failed" })
    }
  } catch (err) {
    logger.error(err)
  }
}

o.deleteOrganization = async function (request, response) {
  const { id } = request.query
  const query = `DELETE FROM organization WHERE ID = ?`
  connection.query(query, id, function (err, result) {
    if (err) {
      logger.error(err)
    }
    if (result) {
      result.affectedRows == 1
        ? response.send({ statusCode: 201, message: "organization deleted successfully" })
        : response.send({ statusCode: 401, message: "No deletion done" })
    }
  })
}

o.getOrganizationId = async function (request, response) {
  const id = request.query.id
  const query = `SELECT * FROM organization WHERE ID = ?`
  connection.query(query, id, function (err, result) {
    if (err) {
      logger.error(err)
    }
    if (result) {
      // converting keys to camel case

      const data = JSON.parse(JSON.stringify(result[0]).toLowerCase())
      response.send({ statusCode: 201, data: data })
    }
  })
}

o.getOrganizationCommissionByMonth = async function (request, response) {
  const { id } = request.query
  const query = `SELECT PAID_AMOUNT FROM billing WHERE organization = ?`
}

o.dailyOrganizationCommission = async function (request, response) {
  const { id } = request.query

  const query = `SELECT 
        SUM(b.PAID_AMOUNT) AS COMMISION,
        DAY(pt.DATE) AS DAY
        FROM billing AS b INNER JOIN performing_test
        AS pt ON b.BILLINGID = pt.BILLINGID 
        WHERE b.ORGANIZATION = ${id} AND MONTH(pt.DATE) = MONTH(NOW())
          AND YEAR(NOW()) = YEAR(pt.DATE)
        GROUP BY DAY(pt.DATE) ORDER BY DAY(pt.DATE) ASC`
  connection.query(query, function (err, result) {
    if (err) {
      logger.error(err)
    }
    if (result) {
      response.send(result)
    }
  })
}

o.getOrganizationCommissionByMonth = async function (request, response) {
  const { id } = request.query

  const query = `SELECT
        SUM(b.PAID_AMOUNT) AS COMMISION,
        MONTH(pt.DATE) AS MONTH
        FROM billing AS b INNER JOIN performing_test
        AS pt ON b.BILLINGID = pt.BILLINGID
        WHERE b.ORGANIZATION = ${id} AND YEAR(pt.DATE) = YEAR(NOW())
        GROUP BY MONTH(pt.DATE) ORDER BY MONTH(pt.DATE) ASC`
  connection.query(query, function (err, result) {
    if (err) {
      logger.error(err)
    }
    if (result) {
      response.send(result)
    }
  })
}

o.getTopPerformance = async function (request, response) {
  const { count, from, to } = request.query

  if (!count) {
    customError("count represent top count required", 401, response)
  } else {
    let query_string = `
      SELECT DISTINCT o.ID AS id,
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
          INNER JOIN organizationaccountinformation AS oc ON oc.organizationid = o.id
      `

    if (from && to) {
      query_string += ` WHERE pt.date BETWEEN '${from}' AND '${to}'`
    }

    if (from && !to) {
      query_string += ` WHERE pt.date BETWEEN '${from}' AND CURRENT_DATE`
    }

    query_string += ` GROUP BY o.id,
          o.name
        ORDER BY TotalSales DESC  LIMIT ${count}`

    connection.query(query_string, function (err, result) {
      if (err) {
        response.send({
          message: err.message,
          statusCode: 500,
          status: "error",
        })
      } else {
        response.send({
          result,
          statusCode: 200,
          status: "success",
        })
      }
    })
  }
}

module.exports = o
