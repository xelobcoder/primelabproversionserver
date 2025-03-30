const pdf = require('pdf-creator-node');
const fs = require('fs');
const { customError} = require("../../helper")
const path = require("path")
const ResultPrint = require("./ResultPrint")
const { getCompanyInfo } = require("../settings/companydata")
const logger = require("../../logger")
const Registration = require("./registration")
const TestSetup = require("./testSetup.model")
const Creator = require("./creator")

class PDFGENERATION extends ResultPrint {
  constructor(billingid, testid, testname) {
    super()
    this.billingid = billingid
    this.testid = testid
    this.testname = testname
  }

  isValidTest() {
    return testTable[this.testname] != undefined ? testTable[this.testname] : false
  }
  isCategoryAvailable() {
    return testCategoryMapping[this.testname] != undefined ? testCategoryMapping[this.testname] : false
  }
  isSetupAvailabble() {
    return setups[this.testname] != undefined ? setups[this.testname] : false
  }

  async generatePDFdata() {
    try {
      let companyinfo = await getCompanyInfo()
      companyinfo = companyinfo.length > 0 ? companyinfo[0] : {}
      let sampling = await this.getSamplingInformation(this.billingid, this.testid)
      const testname = this.testname.includes("_") ? this.testname.split("_").join(" ") : this.testname
      let patientid = ""
      patientid = await new Registration().getPatientInfoUsingBillingId(this.billingid)
      if (patientid.length > 0) patientid = patientid[0]["patientid"]
      const creator = new Creator(this.testid)
      const testInformation = await creator.getCustomPreviousRecords(this.testname, this.billingid, patientid)
      let comments = await creator.getCustomCommentsRecords(this.billingid, this.testid)
      const data = {
        testname,
        testInformation,
        sampling,
        comments,
        // literature,
        companyinfo,
      }

      const haslimits = testInformation.some((item, index) => item.haslimits == true)

      return { haslimits, data }
    } catch (err) {
      logger.error(err)
      console.log(err)
      return "error generating pdf data"
    }
  }

  async renderOptions(haslimit) {
    if (haslimit) {
      return "./api/views/pdfs/result/hasLimits.html"
    } else {
      return "./api/views/pdfs/result/hasnoLimits.html"
    }
  }

  async generatePDFResult(response) {
    const pdfdata = await this.generatePDFdata()
    const { data, haslimits } = pdfdata
    const renderOptions = await this.renderOptions(haslimits)
    const html = fs.readFileSync(renderOptions, "utf-8")

    var options = {
      format: "A3",
      orientation: "portrait",
      border: "10mm",
    }

    var document = {
      html: html,
      path: path.join(__dirname, "../views/pdfs/result.pdf"),
      type: "",
    }

    try {
      if (data) {
        document.data = data
        await pdf.create(document, options)
        const filelocation = path.join(__dirname, "../views/pdfs/result.pdf")
        if (response) response.sendFile(filelocation)
      }
    } catch (err) {
      customError(err?.message, 500, response)
    }
  }
}







module.exports = PDFGENERATION;
