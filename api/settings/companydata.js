const connection = require("../db.js");
const path = require("path");
const fs = require("fs");
const logger = require("../../logger.js");
const { promisifyQuery, convertKeysToLowerCase, customError } = require("../../helper.js");

let SQL_QUERY_ALL = "SELECT name, email, motto, phonenumber, address, website, street, alternativenumber FROM companyprofile";
let SQL_QUERY_INSERT = `INSERT INTO companyprofile (name, email, motto, phonenumber, address, website, street, alternativenumber) VALUES (?,?,?,?,?,?,?,?)`;


let TRUNCATE_QUERY = `TRUNCATE TABLE COMPANYPROFILE`;

const AddCompanyInfo = function (request, response) {
  const { target, name, motto, email, phonenumber, address, website, alternativeNumber, street } = request.body;

  const PARAMETERS = [name, email, motto, phonenumber, address, website, street, alternativeNumber];

  connection.query(TRUNCATE_QUERY, (err, result) => {
    if (err) {
      logger.error(err);
    }
    if (result) {
      connection.query(SQL_QUERY_INSERT, PARAMETERS, function (err, result) {
        if (err) {
          response.send({
            status: "error",
            message: err.message,
            statusCode: 500,
          });
        }
        if (result) {
          if (result.affectedRows == 1) {
            response.status(201).json({ status: "success" });
          }
        }
      });
    }
  });
};

const getCompanyInfo = async function (request, response) {
  try {
    let result = await promisifyQuery(SQL_QUERY_ALL);
    if (result && result.length > 0) {
      result = result.map((item, index) => {
        return convertKeysToLowerCase(item);
      });
      return response ? response.send(result[0]) : result;
    }
  } catch (err) {
    logger.error(err);
    response && customError("error getting company info", 500, response);
  }
};

const getCompanyImage = async function (request, response) {
  try {
    const folderPath = path.join(__dirname, "company");
    const files = fs.readdirSync(folderPath);

    const imageFile = files.find((file) => {
      const fileExtension = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif"].includes(fileExtension);
    });

    if (imageFile) {
      const imagePath = path.join(folderPath, imageFile);
      const image = fs.readFileSync(imagePath);
      response.setHeader("Content-Type", "image/jpeg"); 
      response.setHeader("Content-Length", image.length);
      response.send(image);
    } else {
      response.status(404).send("Image not found");
    }
  } catch (error) {
    response.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getCompanyInfo,
  AddCompanyInfo,
  getCompanyImage,
};

// const imagesretainer = function (res) {
//    let turn = path.join(
//       "C:/Users/leonides/Documents/GitHub/image-r-v/lobnos",
//       "./public/asserts/companylogo.jpg"
//    );
//    fs.createReadStream(turn).pipe(res);
// };
