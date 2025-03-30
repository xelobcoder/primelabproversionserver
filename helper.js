const connectionpool = require("./api/dbpool");
const logger = require("./logger");

function customError(message, statusCode, response) {
  if (!response) {
    throw new TypeError("Http response object required");
  }
  response.send({ message: message || "something wrong occured", statusCode: statusCode || 500, status: "error" });
}
function responseError(response, err = null) {
  response.send({ message: "something wrong occured", statusCode: 500, status: "error" });
  if (err) logger.log(err);
}

const removeHtmlTags = (string) => {
  const removeTags = (string, starter, ended) => {
    const _stringArray = string.trim().split("");
    let start = 0;
    let end = 0;

    for (let i = 0; i < _stringArray.length; i++) {
      if (_stringArray[i] === starter) {
        start = i;
      }

      if (_stringArray[i] === ended) {
        end = i;
        break;
      }
    }

    const umatched = _stringArray.map((item, index) => {
      if (!(index >= start && index <= end)) return item;
    });

    const result = umatched.join("");

    if (umatched.includes(starter) || umatched.includes(ended)) {
      return removeHtmlTags(result);
    }
    return result.toLowerCase();
  };
  return string;
};

function convertKeysToLowerCase(obj) {
  if (typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Input must be an object");
  }
  const result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key.toLowerCase()] = obj[key];
    }
  }
  return result;
}

function NotFound(response) {
  response.send({ message: "Data not found", status: "error" });
}

function promisifyQuery(query, values = []) {
  if (!query || typeof query != "string") {
    throw new Error("query must be added and a string type");
  }
  return new Promise((resolve, reject) => {
    connectionpool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      }
      connection.query(query, values, (queryError, result) => {
        connection.release();
        if (queryError) {
          console.log(queryError);
          reject(queryError);
        } else {
          resolve(result);
        }
      });
    });
  });
}

async function retryableTransaction(fn, maxRetries = 3, delayBetweenRetries = 1000) {
  let retries = 0;

  async function attempt() {
    try {
      await fn();
    } catch (error) {
      if (error.code === "ER_LOCK_WAIT_TIMEOUT" && retries < maxRetries) {
        retries++;
        console.warn(`Lock wait timeout, retrying (${retries}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries));
        return attempt();
      } else {
        throw error;
      }
    }
  }

  await attempt();
}

async function paginationQuery(pageQuery, query, values) {
  let useQuery = { count: pageQuery?.count || 10, page: pageQuery?.page || 1 };
  const { count, page } = useQuery;
  const pageSize = parseInt(count);
  const currentPage = parseInt(page) - 1;
  const offset = currentPage * pageSize;
  let newValues = [pageSize, offset];
  if (values && values.length > 0) newValues = [...values, ...newValues];
  return await promisifyQuery(query, newValues);
}

const getFullBloodCountTrend = async (patientid) => {
  const getClientGenderPacket = await promisifyQuery(`SELECT gender,age,agetype FROM new_patients WHERE patientid = ?`, patientid);

  const gender = getClientGenderPacket.length > 0 ? getClientGenderPacket[0]["gender"] : null;

  const age = getClientGenderPacket.length > 0 ? getClientGenderPacket[0]["age"] : null;
  const agetype = getClientGenderPacket.length > 0 ? getClientGenderPacket[0]["agetype"] : null;

  let trendDataSet = await promisifyQuery(PatientQueries.getFbcTrend(gender, age, agetype), [patientid]);

  trendDataSet =
    trendDataSet.length > 0
      ? trendDataSet.map((item) => {
          return convertKeysToLowerCase(item);
        })
      : [];

  return trendDataSet;
};

const rowAffected = (result) => {
  return result.affectedRows > 0 ? true : false;
};

const hasSpecialCharacters = (param, exclude) => {
  if (exclude && !(typeof exclude === "string" || Array.isArray(exclude))) throw new TypeError("exclude should be an array or a string");
  if (typeof exclude === "string") exclude = exclude.split("");
  var hascharacter = false;
  const specialCharacters = [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "[",
    "]",
    "{",
    "}",
    ";",
    ":",
    '"',
    "'",
    "\\",
    "|",
    ",",
    ".",
    "<",
    ">",
    "/",
    "?",
    "`",
    "~",
  ];

  for (const char of param) {
    specialCharacters.includes(char) ? (hascharacter = exclude && exclude.includes(char) ? false : true) : hascharacter;
  }
  return hascharacter;
};

module.exports = {
  customError,
  convertKeysToLowerCase,
  getFullBloodCountTrend,
  responseError,
  promisifyQuery,
  NotFound,
  hasSpecialCharacters,
  removeHtmlTags,
  paginationQuery,
  rowAffected,
  retryableTransaction,
};
