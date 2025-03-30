const logger = require("../../logger");
const connection = require("../db");
const User = require('../LobnosAuth/user')

function resetDatabaseToDefault() {
  let errorCount = [];
  const getallTables = `SHOW TABLES`;

  connection.query(getallTables, function (err, result) {
    if (err) {
     logger.error(err.message);
    }

    // list of tables that should not be truncated
    const requiredTables = ['test_panels', 'applicationsettings', 'sampletypes', 'new_patients']

    const truncateTable = function (name) {
      connection.query(`TRUNCATE TABLE ${name}`, (err, result) => {
        if (err) { errorCount.push(err.message); }
        return;
      })
    }

    if (result.length > 0) {
      const dbNames = result.map((item, index) => {
        return item.Tables_in_limsdb
      })

      dbNames.forEach((item, index) => {
        if (requiredTables.includes(item)) {
          return
        } else {
          truncateTable(item)
        }

        if (index + 1 == dbNames.length) {
          return true;
        }
      })

    }
  })

  return true
}


function addDefaults(response) {
  const modes = ['momo', 'cheque', 'bank transfer', 'cash', 'invoice']
  const query = `INSERT INTO paymentmodes(paymentMode) VALUES (?)`;

  modes.forEach((item, index) => {
    connection.query(query, item, (err, result) => {
      if (err) {
        if (err.errno == 1062) {
          return;
        }
      }
      if (response) {
        response.send({
          message: 'default payment modes added',
          statusCode: 200,
          status: 'success'
        })
      }
    })
  })
}



function addDefualtDepartments() {
  const departments = ['serology', 'hematology', 'endocrinology', 'chemistry', 'microbiology'];


  const query = `INSERT INTO departments (department,departmentManager,employeeid) VALUES (?,'',0)`;

  departments.forEach((item, index) => {
    connection.query(query, [item], (err, result) => {
      if (err) {
        if (err.errno == 1062) {
          return;
        }
      }
      console.log(result)
    })
  })
}




function addAdminLogins() {
  const admin = new User('mildred', 'tiifu', 'admin', 'mildred@gmail.com');

  admin.createUser()
    .then((data) => console.log(data))
    .catch((err) => console.log(err))
}


// resetDatabaseToDefault();
// addDefaults()
// addDefualtDepartments()


// addAdminLogins();
