const Inventoryanalytics = require("./inventoryAnalytics")
const Wastage = require("./wastageClass")
const analytics = new Inventoryanalytics()



async function nearExpiry() {
  let result = await analytics.getNearExpiry()

  const newArray = []

  result = await Promise.all(
    result.map(async (item, index) => {
      const { batchnumber, brand, stockid } = item
      const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber)
      return { ...item, qty_in_stock: tt }
    })
  )

  // ensuring we have unique stocks
  for (let i = 0; i < result.length; i++) {
    const matched = result.filter((item, index) => {
      const { batchnumber, brand, stockid } = item
      return batchnumber == result[i]["batchnumber"] && brand == result[i]["brand"] && stockid == result[i]["stockid"]
    })

    const filterNew = newArray.filter((u, t) => {
      const { batchnumber, brand, stockid } = u
      return batchnumber == result[i]["batchnumber"] && brand == result[i]["brand"] && stockid == result[i]["stockid"]
    })

    if (newArray.length === 0) {
      const sum = [...matched].reduce((a, b) => a + b.quantityReceived, 0)
      newArray.push({ ...result[i], quantityReceived: sum })
    } else {
      if (filterNew.length == 0) {
        const sum = [...matched].reduce((a, b) => a + b.quantityReceived, 0)
        newArray.push({ ...result[i], quantityReceived: sum })
      }
    }
  }
  response.send({ result: newArray, status: "success" })
}




async function expiredProducts() {
  let result = await analytics.getExpiredCount()
  result = result.map(async (item, index) => {
    const { batchnumber, receiveddate, expirydate, quantityReceived, name, expiredDisposed, stockid, brand } = item
    let amtInstock = 0
    if (expiredDisposed === 1) {
      amtInstock = await wastage.calcalulateWastageTotal(stockid, brand, batchnumber);
    } else {
      const tt = await wastage.calculateProductInstock(stockid, brand, batchnumber);
      amtInstock = tt
    }
    return { receiveddate, batchnumber, expirydate, quantityReceived, name, expiredqty: amtInstock, expiredDisposed }
  })
  result = await Promise.all(result)
  response.send({ result, status: "success" });
}




const wastage = new Wastage()

const urgentActions = async (action, response) => {
  let result;
  switch (action) {
    case "nearexpiry":
      nearExpiry();
      break;
    case "expired":
      expiredProducts();
      break;
    case "belowalert":
      result = await analytics.getBelowAlert();
      break;
    case "uncompletedorders":
      result = await analytics.getIncompOrdersCount()
      break;
    case "completedorders":
      result = await analytics.completeOrdersCount()
      break;
    default:
      result = [];
  }
  response.send({ result, status: "success" })
  // if (action === "nearexpiry") {



  // } else if (action === "expired") {

  // } else if (action === "belowalert") {
  //   const result = await analytics.getBelowAlert()
  //   response.send({ result, status: "success" })
  // } else if (action === "uncompletedorders") {
  //   const result = await analytics.getIncompOrdersCount()
  //   response.send({ result, status: "success" })
  // } else if (action === "completedorders") {
  //   const result = await analytics.completeOrdersCount()
  //   response.send({ result, status: "success" })
  // } else {
  //   response.send({ result: [], status: "warning" })
  // }
}

module.exports = urgentActions
