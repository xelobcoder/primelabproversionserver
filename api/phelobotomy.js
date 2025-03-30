
const connection = require("./db");
const logger = require("../logger");
const { promisifyQuery, customError, convertKeysToLowerCase, paginationQuery, rowAffected } = require("../helper")

// let filteredTest_in_date = function (test, res) {
//   // check if array
//   const isArray = Array.isArray(test) ? true : false
//   // check is empty or not

//   const isEmpty = test.length == 0 ? true : false

//   if (isArray && !isEmpty) {
//     let today = new Date()

//     let filtereddate = test.filter(function (item) {
//       // filter today from test array
//       let date = new Date(item.DATE)
//       return date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()
//     })

//     res.send(filtereddate)
//   } else {
//     res.send(test)
//   }
// }

const getPhelobotomy = async (req, res) => {
  const { count, page } = req.query
  let myquery = `
        SELECT
          CASE
              WHEN p.MIDDLENAME IS NULL THEN CONCAT(p.FIRSTNAME, " ", p.LASTNAME)
              ELSE CONCAT(p.FIRSTNAME, " ", p.MIDDLENAME, " ", p.LASTNAME)
          END AS fullname,
          p.patientid,
          CONCAT(p.age, " ", p.agetype) AS age,
          p.gender,
          p.mobile_number AS mobilenumber,
          b.billingid AS billingid,
        b.billedon AS date,
        b.clientstatus 
      FROM new_patients AS p
      INNER JOIN billing AS b ON p.patientid = b.patientid
      INNER JOIN test_ascension AS ts ON b.billingid = ts.billingid
      WHERE ts.collection = 'false'
      GROUP BY b.billingid
      ORDER BY b.billingid ASC LIMIT ? OFFSET ?;
  `
  try {
    let result = await paginationQuery({ count, page }, myquery)
    res.send({ message: "success", statusCode: 200, result, status: "success" })
  } catch (err) {
    console.log(err)
    customError(`error fetching data`, 500, res)
    logger.error(err)
  }
}

const get_client_query = function (req, res) {
  let { billingid } = req.query;

  if (!billingid) {
    res.send({
      statusCode: 200,
      status: 'success',
      message: 'billingid required'
    })
  }

  if (billingid) {
    // parseint to ensure a valid integer is queried againts db
    billingid = parseInt(billingid);

    const query = `SELECT * FROM NEW_PATIENTS AS np
    INNER JOIN BILLING AS b ON np.PATIENTID = b.PATIENTID
    INNER JOIN PERFORMING_TEST AS p ON b.BILLINGID = p.BILLINGID
    WHERE p.BILLINGID = ?`

    connection.query(query, billingid, function (err, result) {
      if (err) {
        res.send({
          message: 'error', statusCode: 500, message: err.sqlMessage
        })
      }
      else {
        res.send({ message: 'success', statusCode: 200, result })
      }
    })
  }
}

const updatePhelobotomy = async (id, content, status, alltaken, completedTime, req, res) => {
  let myquery = `UPDATE 
  performing_test 
  SET PHELOBOTOMY_STATUS = '${status}',
  PHELOBOTOMY_MESSAGE = '${content}',
  ALL_SAMPLE_TAKEN = '${alltaken}',
  TIME_PHELOBOTOMY_COMPLETED = TIMESTAMP('${completedTime}')
  WHERE ID = ${id}`;
  connection.query(myquery, (err, result) => {
    if (err) {logger.error(err)};
    res.send(result);
  }
  )
}


const postSection = async function (request, response) {
  const { testinfo, employeeid } = request.body;
  if (!employeeid) {
    return customError(`employeeid or phelobotomist id not included`, 404, response);
  }

  if (!Array.isArray(testinfo)) {
    return customError('testinfo must be an array', 404, response);
  }

  const collected_sample = testinfo.filter((item, index) => item.collection == "true");

  if (collected_sample.length == 0) {
    return customError('samples not collected', 404, response);
  }

  try {
    connection.beginTransaction(async function (err) {
      if (err) {
        logger.error(err)
        throw new Error(err?.message);
      };
      collected_sample.forEach(async function (item, index) {
        const { samplemessage, testid, collection, collection_date, billingid } = item;
        const updateTestAscensionQuery = `UPDATE 
        test_ascension SET collection = ?,
         collection_date = ?
         WHERE billingid = ?
         AND testid = ?`;
        const ascensionValues = [collection, collection_date, billingid, testid];
        const updatedAscension = rowAffected(await promisifyQuery(updateTestAscensionQuery, ascensionValues));
        if (updatedAscension) {
          const updateSampleStatusQuery = `UPDATE 
              samplestatus
              SET samplemessage = ?,
              phelobotomist = ?
              WHERE testid = ?
          AND billingid = ?`;

          const sampleStatusValues = [samplemessage, employeeid, testid, billingid];
          await promisifyQuery(updateSampleStatusQuery, sampleStatusValues);
          if (index === collected_sample.length - 1) {
            connection.commit(function (err) {
              if (err) {
                connection.rollback(function () { { logger.error(err) }; });
              }
              response.send({ message: 'updated successfully', statusCode: 200, status: 'success', })
            });
          }
        }
      });
    });
  }
  catch (err) {
    logger.error(err);
    connection.rollback();
    response.send(response);
  }
}

const getAscensionWithDetails = async function (billingid, state, response) {
  let statement = `SELECT 
  DISTINCT * FROM test_ascension AS t 
    INNER JOIN test_panels AS p ON t.testid = p.ID
    INNER JOIN samplestatus AS s ON s.ascensionid = t.id
  WHERE t.billingid = ?
`;
  
  if (state == 'false') { statement += ` AND t.collection = 'false'` }
  try {
    const result = await promisifyQuery(statement, billingid);

    const transformed = result.map((item, index) => {
      return convertKeysToLowerCase(item);
    })

    response.send({ message: 'success', statusCode: 200, result: transformed, status: 'success' });
  } catch (err) {
    logger.error(err);
    customError('error fetching data', 500, response);
  }
}




const sampleAssesment = async function (req, res) {
  const { billingid } = req.query;

  if (!billingid) {
    res.send({ message: 'billingid required', statusCode: 401, status: 'error' })
  } else {
    //  test collection must be true in test ascension table 
    const statement = `
        SELECT DISTINCT name,
            sample,
            t.collection,
            t.testid,
            t.billingid,
            t.id,
            ss.rejectionmessage,
            ss.approvalstatus
          from test_ascension AS t
            INNER JOIN test_panels AS tt ON tt.id = t.testid
            INNER JOIN samplestatus AS ss ON ss.testid = t.testid
          WHERE t.billingid = ?
            AND t.collection = 'true'
            AND ss.approvalstatus IS NULL
            AND ss.rejectionmessage IS NULL
            AND t.collection_date IS NOT NULL
         GROUP BY t.testid
`

    try {
      let result = await promisifyQuery(statement, billingid)
      if (result.length > 0 && Array.isArray(result)) {
        result = result.map((item, index) => convertKeysToLowerCase(item))
      }
      res.send({ message: "success", statusCode: 200, result, status: "success" })
    } catch (err) {
      logger.error(err)
      customError("error fetching data", 500, res)
    }
  }
}




module.exports = {
  getPhelobotomy,
  updatePhelobotomy,
  get_client_query,
  postSection,
  getAscensionWithDetails,
  sampleAssesment
}