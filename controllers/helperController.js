const multer = require("multer");
const fs = require("fs");
const fse = require("fs-extra");
const AdmZip = require("adm-zip");
const axios = require("axios");
const moment = require("moment");
const excel = require("excel4node");
const knex = require("../config/database");
const { resolve } = require("path");

exports.sendApiResult = function (success, message, data = {}) {
  var data = {
    success,
    message,
    data,
  };
  return data;
};

exports.sendReportApiResult = function (success, message, data = []) {
  var data = {
    success,
    message,
    data,
  };
  return data;
};

exports.blockunblock = function (success, paginate, data = {}) {
  var data = {
    success,
    paginate,
    data,
  };
  return data;
};

exports.makeRandStr = function (length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

exports.randomIntFromInterval = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.bankApi = async function (params) {
  let output;
  const response = await axios
    .get("http://localhost:8989/dummy-city-bank", {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjo4MiwibmFtZSI6ImFkbWluIiwiZW1haWwiOiJhYUBiYi5jb20iLCJwaG9uZSI6IjAxODYyNDgyNTMyIiwiY3JfdXNlcl90eXBlIjoiZmkifSwiaWF0IjoxNjExNDYzOTQ5LCJleHAiOjE2MTI0NjM5NDh9.V1Og4xA5fXqfz1iL7M0qf7RJwBMuAbuIYwv3Q0x-VgE",
      },
      params,
    })
    .then((response) => {
      output = response.data;
      // console.log(response);
    })
    .catch((error) => {
      // console.log(error);
    });
  return output;
};

exports.uploaddir = "/public/uploads/";

exports.fileUploadConfig = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.scopeOutletUpload = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/scope_outlets/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.bulkKYCApproveUpload = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/kyc_bulk_upload/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.uploadOutletInfo = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/outlet_documents/outlet_nid_info/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

// @arfin

exports.uploadUserDetailsInfoFile = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/user_details/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.docSubmittedUpload = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/doc_submitted/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.fileUploadConfigTnx = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/tnx_uploads/");
    },
    filename: (req, file, cb) => {
      if (typeof file !== undefined) {
        cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
      }
    },
  });
  return storage;
};

exports.fiLogoUpload = function () {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/fi_logos/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

exports.uploadRetailerDocsConfig = function (folder_name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const outlet_id = file.originalname.split("_");
      // const path= `./public/${folder_name}/${outlet_id[0]}`;
      const path = `../../../../../backup/public/${folder_name}/${outlet_id[0]}`;
      console.log(path);
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  return storage;
};

exports.uploadAccountFormsConfig = function () {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const outlet_id = file.originalname.split("_");

      console.log(req.body.names);
      const path = "./public/outlet_documents/";
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  return storage;
};

exports.uploadBulkFormConfig = function (folder_name) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const path = `./public/${folder_name}/`;
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  return storage;
};

exports.saveZip = function (names, initial_location, target_location) {
  try {
    const zip = new AdmZip();
    const dirname = `${__dirname}/../../public/${initial_location}`;
    const uploaddir = `${__dirname}/../../public/${target_location}`;

    names.forEach((e) => {
      zip.addLocalFile(`${dirname}/${e}`);
    });

    const downloadName = `${Date.now()}.zip`;
    zip.writeZip(`${uploaddir}/${downloadName}`);

    return downloadName;
  } catch (e) {
    console.log(e);
    return false;
  }
};
exports.saveZipFolder = function (folder_name, target_location, file_name) {
  const zip = new AdmZip();
  // const dirname = __dirname + "/../../public/"+folder_name;
  const dirname = `${__dirname}/../../../../../../../backup/public/${folder_name}`;
  const uploaddir = `${__dirname}/../../public/${target_location}`;
  zip.addLocalFolder(dirname);
  const downloadName = `${file_name}.zip`;
  zip.writeZip(`${uploaddir}/${downloadName}`);
  return downloadName;
};
exports.saveZipMultipleFolder = async function (
  folders,
  initial_location,
  target_location,
  file_name
) {
  const zip = new AdmZip();
  // const dirname = __dirname + "/../../public/"+initial_location;
  const dirname = `${__dirname}/../../../../../../../backup/public/${initial_location}`;
  const uploaddir = `${__dirname}/../../public/${target_location}`;

  const destDir = `${dirname}/tempForBulkZip`;

  fse.emptyDirSync(destDir, (err) => {
    if (err) return console.error(err);
    console.log("tempForBulkZip empty success!");
  });

  for (let i = 0; i < folders.length; i++) {
    const e = folders[i];
    const srcDir = `${dirname}/${e}`;
    const destOutletDirs = `${dirname}/tempForBulkZip/${e}`;

    fse.emptyDirSync(destOutletDirs, (err) => {
      if (err) return console.error(err);
      console.log(`${e} empty success!`);
    });
    await fse.copy(srcDir, destOutletDirs, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log("success!");
      }
    });
  }
  await timeout(1500);
  zip.addLocalFolder(`${dirname}/tempForBulkZip`);
  const downloadName =
    file_name == null ? `${Date.now()}.zip` : `${file_name}.zip`;
  zip.writeZip(`${uploaddir}/${downloadName}`);

  return downloadName;
};

exports.fileUploadInterestSettings = function (name) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/interest_settings/");
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.downloadFile = function (req, res) {
  const file = `${__dirname}/../../public/${req.params.dir_name}/${req.params.file_name}`;
  res.download(file); // Set disposition and send it.
};
exports.seeFile = function (req, res) {
  const file = `${__dirname}/../../public/${req.params.dir_name}/${req.params.file_name}`;
  res.send(file);
};

exports.DynamicFileUploadConfig = function (name) {
  const max = 100;
  const filePath = name;
  const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
      callBack(null, "./public/yearly-sales-file/");
    },
    filename: (req, file, callBack) => {
      callBack(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
    },
  });
  return storage;
};

// exports.OutletCreditInfo = async function (outletId) {
exports.OutletCreditInfo = async function (retailer_id) {
  // **** most important
  // retailer_id = retailers.id;
  // outletId = cr_retail_limit.id_outlet;

  const outlet_info = await knex("retailers")
    .select("cr_retail_limit.id_outlet AS id_outlet")
    .innerJoin(
      "cr_retail_limit",
      "cr_retail_limit.outlet_code",
      "retailers.retailer_code"
    )
    .where({ "retailers.id": retailer_id, "retailers.stts": 1 })
    .first();

  if (outlet_info == undefined || Object.keys(outlet_info).length == 0) {
    return {};
  }

  const outletId = outlet_info.id_outlet;

  const credit = await knex
    .select(
      knex.raw(`retail.id_outlet,
      retail.outlet_code,
      retail.phone,
	  retail.outlet_name,
      IFNULL(retail.allowed_limit,0) as total_limit,
      IFNULL(retail.daily_limit,0) as daily_limit,
      IFNULL(retail.credit_amount,0) as credit_amount,
      IFNULL(retail.current_balance,0) as current_balance,
      IFNULL(LEAST(retail.current_balance, retail.daily_limit),0) as daily_current_limit,
      IFNULL(retail.total_interest_due,0) as total_interest_due,
      IFNULL(retail.total_due,0) as total_due,
      IFNULL(retail.minimum_due,0) as minimum_due,
      IFNULL(disbursement.paid_amount,0) as paid_amount,
      IFNULL(retail.total_due,0) as due_amount,
      IFNULL(disbursement.cash_payment,0) as cash_payment,
      IFNULL(disbursement.total_interest_amount,0) as total_interest_amount,
      IFNULL(disbursement.total_paid_interest_amount,0) as total_paid_interest_amount,
      IFNULL(retail.carry_amount,0) as carry_amount`)
    )
    .from({ retail: "cr_retail_limit" })
    .leftJoin({ disbursement: "cr_credit_disbursements" }, function () {
      this.on("retail.id_outlet", "=", "disbursement.id_outlet");
      this.andOnVal("disbursement.activation_status", "=", "Active");
      this.andOnVal("disbursement.due_amount", "<>", 0);
    })
    .where("retail.id_outlet", outletId)
    .andWhere("retail.activation_status", "Active")
    .andWhere("retail.kyc_status", "Approved")
    .first();

  let daily_credit_limit_ratio = {};
  if (typeof credit !== "undefined") {
    const section_data = await knex("retailers")
      .select(
        "section_days.saturday",
        "section_days.sunday",
        "section_days.monday",
        "section_days.tuesday",
        "section_days.wednesday",
        "section_days.thursday"
      )
      .join("routes", "retailers.rtid", "routes.id")
      .join("section_days", "routes.section", "section_days.section")
      .where({
        // "retailers.retailer_code": credit.outlet_code,
        "retailers.id": retailer_id,
        "retailers.stts": "1",
        "routes.stts": "1",
      })
      .first();

    let date;
    let dayName;
    var howManyDays = 0;
    const dayDifference = [];
    let weekly_sales_days_count = 0;
    for (let i = 1; i <= 7; i++) {
      date = moment(new Date(), "YYYY-MM-DD")
        .add(i, "days")
        .format("YYYY-MM-DD");
      dayName = moment(date).format("dddd").toLowerCase();
      if (dayName != "friday") {
        if (section_data[dayName] !== undefined) {
          weekly_sales_days_count += parseInt(section_data[dayName]);
          if (parseInt(section_data[dayName]) == 1) {
            if (Object.keys(dayDifference).length == 0) {
              dayDifference.push(date);
              howManyDays = i;
            }
          }
        }
      }
    }

    daily_credit_limit_ratio = await knex("cr_retailer_daily_credit_config")
      .select("count", "multiply")
      .where({
        count: weekly_sales_days_count,
        status: 1,
      })
      .first();

    // daily_credit_limit_ratio.multiply = 1;
  }

  /*
    var howManyDays = 2;
    if (moment().day() == 3) { // 3 == wednesday
      howManyDays = 3;
    }
  */

  const disbursements = await knex
    .select("dwi.*")
    .from({ disb: "cr_credit_disbursements" })
    .join({ dwi: "cr_disbursement_wise_interest" }, function () {
      this.on("disb.id", "=", "dwi.id_cr_credit_disbursement");
      this.andOnVal("dwi.is_current_transaction", "=", 1);
    })
    .where("disb.due_amount", "<>", 0)
    .where("disb.id_outlet", outletId);

  let total_due_amount_after_two_days = 0;
  for (let i = 0; i < disbursements.length; i++) {
    const e = disbursements[i];
    total_due_amount_after_two_days +=
      Number(e.due_amount) +
      Number(e.total_sys_interest_amount) +
      (Number(e.due_amount) + Number(e.total_sys_interest_amount)) *
      howManyDays *
      ((Number(e.interest_rate_percentage) +
        Number(e.service_charge_rate_percentage) +
        Number(e.penalty_rate_percentage) * Number(e.is_penalty_interest)) /
        100);
  }

  let outlet_credit = {};

  if (typeof credit !== "undefined") {
    outlet_credit = {
      id_outlet: credit.id_outlet,
      outlet_code: credit.outlet_code,
      outlet_name: credit.outlet_name,
      outlet_phone: credit.phone,
      cash_payment: parseFloat(credit.cash_payment).toFixed(2),
      total_limit: parseFloat(credit.total_limit).toFixed(2),
      daily_limit: parseFloat(
        credit.daily_limit * daily_credit_limit_ratio.multiply
      ).toFixed(2),
      current_balance_old: parseFloat(credit.current_balance).toFixed(2),
      daily_current_limit: parseFloat(
        credit.daily_current_limit * daily_credit_limit_ratio.multiply
      ).toFixed(2),
      current_balance: parseFloat(
        credit.daily_current_limit * daily_credit_limit_ratio.multiply
      ).toFixed(2),
      total_interest_amount: parseFloat(credit.total_interest_amount).toFixed(
        2
      ),
      total_interest_due: parseFloat(credit.total_interest_due).toFixed(2),
      total_due_amount_after_two_days: parseFloat(
        total_due_amount_after_two_days
      ).toFixed(2),
      date_after_two_days: moment(new Date(), "DD-MM-YYYY")
        .add(howManyDays, "days")
        .format("DD-MMM-YYYY"),
      due_amount: (
        parseFloat(credit.due_amount) - parseFloat(credit.total_interest_due)
      ).toFixed(2),
      total_due_amount: parseFloat(credit.due_amount).toFixed(2),
      paid_amount: parseFloat(credit.paid_amount).toFixed(2),
      total_paid_interest_amount: parseFloat(
        credit.total_paid_interest_amount
      ).toFixed(2),
      minimum_due: parseFloat(credit.minimum_due).toFixed(2),
      carry_amount: parseFloat(credit.carry_amount).toFixed(2),
    };
  }
  return outlet_credit;
};

exports.generaeteExcel = function (header, data, fileName, numberCast) {
  const headers = ["SL"];
  const headerKeys = [];
  for (const property in header) {
    headers.push(header[property]);
    headerKeys.push(property);
  }

  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  const headerStyle = workbook.createStyle({
    fill: {
      type: "pattern",
      patternType: "solid",
      bgColor: "#E1F0FF",
      fgColor: "#E1F0FF",
    },
    font: {
      color: "#000000",
      size: "10",
      bold: true,
    },
  });
  const col = 1;
  let row = 1;
  var col_add = 0;
  headers.forEach((e) => {
    worksheet
      .cell(row, col + col_add)
      .string(e)
      .style(headerStyle);
    col_add++;
  });
  row++;
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    var col_add = 0;
    const obj = data[i];
    worksheet.cell(row, col + col_add).number(++count);
    col_add++;
    for (let i = 0; i < headerKeys.length; i++) {
      const element = headerKeys[i];
      if (numberCast.includes(element)) {
        worksheet.cell(row, col + col_add).number(parseFloat(obj[element]));
        col_add++;
      } else {
        worksheet.cell(row, col + col_add).string(obj[element]);
        col_add++;
      }
    }
    row++;
  }
  workbook.write(`public/generatedExcelFromDT/${fileName}.xlsx`);
  return `download/generatedExcelFromDT/${fileName}.xlsx`;
};

exports.getSettingsValue = async (settings_name, settings_group) => {
  const setting = await knex("cr_settings")
    .where((q) => {
      q.where("activation_status", "Active");
      q.where("settings_name", settings_name);
      if (typeof settings_group !== "undefined") {
        q.where("settings_group", settings_group);
      }
    })
    .first();
  const value = typeof setting !== "undefined" ? setting.settings_value : 0;
  return value;
};

exports.fileUploadReviewOldCredit = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/review_old_credit/");
    },
    filename: (req, file, cb) => {
      if (typeof file !== undefined) {
        cb(null, file.originalname);
      }
    },
  });
  return storage;
};

// @kamruzzaman - start
exports.uploadDynamicBulkConfig = function (name) {
  const max = 100;
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folder_name = req.body.file_for;
      const path = `./public/configuration_file/${folder_name}`;
      fs.mkdirSync(path, { recursive: true });
      cb(null, path);
    },
    filename: (req, file, cb) => {
      if (typeof file !== undefined) {
        cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
      }
    },
  });
  return storage;
};
// @kamruzzaman - end

// @Arfin
exports.ValidatePhoneNumber = function (phoneNumber) {
  const validatePhnRegex = /(^(01))[2|3-9]{1}(\d){8}$/;
  if (phoneNumber.match(validatePhnRegex)) {
    return true;
  }
  return false;
};

exports.ValidateNID = function (nid) {
  const nidStr = nid.toString();
  if (nidStr.includes(".") || nidStr.includes("-") || nidStr.includes("+")) {
    return false;
  }

  if (!isNaN(nid)) {
    const nidLength = nid.toString().length;
    const nidValidLengthArr = [10, 13, 17];
    if (nidValidLengthArr.includes(nidLength)) {
      return true;
    }
    return false;
  }
  return false;
};

exports.ValidateEmail = function (email) {
  var reg = /\S+@\S+\.\S+/;
  if (reg.test(email)) {
    return true;
  }
  return false;
};

exports.ValidateTIN = function (tin) {
  if (!isNaN(tin)) {
    const tinLength = tin.toString().length;
    const tinValidLengthArr = [13];
    if (tinValidLengthArr.includes(tinLength)) {
      return true;
    }
    return false;
  }
  return false;
};

exports.duplication_manufacturer = async function (reg_no) {
  const reg = reg_no.toString();
  const data = await knex
    .from("APSISIPDC.cr_manufacturer")
    .where("cr_manufacturer.registration_no", reg)
    .select("id");
  console.log(data);

  const duplication_check_val = data.length;
  console.log(duplication_check_val);
  await duplication_check_val;
};

exports.hasDupsManuNameInsertArray = function (array) {
  return array
    .map(function (value) {
      return value.Manufacturer_Name;
    })
    .some(function (value, index, array) {
      return array.indexOf(value) !== array.lastIndexOf(value);
    });
};

exports.timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// @Ashik Random Password Generator Start 

exports.randomPasswordGenerator = function (array) {
  const alpha = "abcdefghijklmnopqrstuvwxyz";
  const calpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const num = "1234567890";
  const specials = "!@#$^&*";
  const options = [alpha, alpha, alpha, calpha, calpha, num, num, specials];
  let opt, choose;
  let pass = "";
  for (let i = 0; i < 8; i++) {
    opt = Math.floor(Math.random() * options.length);
    choose = Math.floor(Math.random() * options[opt].length);
    pass = pass + options[opt][choose];
    options.splice(opt, 1);
  }
  return pass;
};

// @Ashik Random Password Generator End 


//@Arfin
exports.generateUserIDMidDigitForLogin = function(number, width) {
  return new Array(width + 1 - (number.toString()).length).join('0') + number;
}
//@Arfin


// @Ashik RETAILER AVERAGE START 

exports.retailerAvgByManufacturer = async (nid , manuId)=> {
  const ticketSizeArray = []
  const repDiffDays = []
  var responseValue;
  var propose_snaction_total_lift_amount ;
   const retailerData =await getOneRmn (nid , manuId)
   if(retailerData?.ac_number_1rmn){
    const manuByretailerData =await getManuByretailerData (nid)
    const allDIsDataCount = await getAllDisDataCount (retailerData?.ac_number_1rmn) ?? []
    const allRepDataCount = await getAllRepDataCount (retailerData?.ac_number_1rmn) ?? []
    const totalClosedLoan = await getTotalClosedLoan (retailerData?.ac_number_1rmn) ?? []
    const currOverDueAmount = await findCurrOverDueAmount(retailerData?.ac_number_1rmn) ?? []
    const currMaxOverdue = await findCurrMaxOverDueAmount(retailerData?.ac_number_1rmn) ?? []
    const currMaxHisOverdue = await findHisMaxOverDueAmount(retailerData?.ac_number_1rmn) ?? []
    const allRepData = await getAllRepData (retailerData.ac_number_1rmn)
    const total_outstanding_value = await getTotalOutstanding(retailerData?.ac_number_1rmn) 
    const overdue_amount_total  = await getTotalOverdueAmount (retailerData?.ac_number_1rmn)
    
    let sales_array = retailerData.sales_array
    let totalSales = getTotal(JSON.parse(sales_array));
    let totalRepDays = 0
    let avgSalarySales = totalSales/12
    propose_snaction_total_lift_amount = retailerData.propose_limit / avgSalarySales
    const now = moment.utc();
    var end = moment(retailerData.crm_approve_date); 
    var days = now.diff(end, "days"); 
    var FirstDateDiff;
 
    const p1 = new Promise((resolve, reject) => {
     if(allRepDataCount.length == 0){
       resolve([])
     }else{
       allRepDataCount && allRepDataCount.length > 0 && allRepDataCount.map(async(value , index)=>{
         if(index==0){
           FirstDateDiff = value.created_at
         }else{
           const nowDate = moment.utc(FirstDateDiff);
           var endDate = moment(value.created_at); 
           var diffDays = endDate.diff(nowDate, "days"); 
           FirstDateDiff = value.created_at
           repDiffDays.push(diffDays)
         }
        if(allRepDataCount.length == index+1){
          resolve(repDiffDays)
        }
       })
     }
     
    })
   
    const p2 = new Promise((resolve, reject) => {
     if(allRepData.length == 0){
       resolve([])
     }else{
       allRepData && allRepData.length > 0 && allRepData.map(async(value , index)=>{
         const countTicketSize = await getCountTicketSize (value.disbursement_id)
         ticketSizeArray.push(countTicketSize.count)
         if(allRepData.length == index+1){
           resolve(ticketSizeArray)
         }
        })
     }
   })
   
 
   const data = Promise.all([p1, p2])
   .then((values) => {
     totalRepDays = getTotal(values[0]);
      responseValue = {
       pre_assigned_limit_manufacturer : retailerData?.propose_limit ?? 0,
       pre_assigned_limit_all_manufacturer : manuByretailerData?.TOTAL_AMOUNT ?? 0,
       avg_ticket_size : (parseInt(allDIsDataCount.count)/parseInt(allRepDataCount.length)) ?? 0,
       highest_ticket_size : (Math.max(...values[1])) ?? 0,
       avg_payment_period : (parseInt(totalRepDays) / parseInt(values[0].length)) ?? 0,
       lowest_ticket_size :  (Math.min(...values[1])) ?? 0,
       relationship_tenor : days ?? 0,
       no_revolving_time : totalClosedLoan?.count ?? 0,
       current_overdue_amount : currOverDueAmount?.overdue_amount ?? 0,
       historical_maximum_overdue : currMaxHisOverdue?.MAXAMOUNT ?? 0,
       current_maximum_overdue : currMaxOverdue?.MAXAMOUNT ?? 0,
       max_sanction_amount_allowed : retailerData?.crm_approve_limit ?? 0,
       proposed_sanction_amount_total_lifting_amount : propose_snaction_total_lift_amount ?? 0,
       total_outstanding : total_outstanding_value.total_outstanding ?? 0,
       avg_monthly_sales: avgSalarySales,
       overdue_amount : overdue_amount_total?.TOTAL_AMOUNT ?? 0 ,
       proposed_sanction_limit_by_system:retailerData.propose_limit ?? 0
     }
     // resolve(responseValue) ;
   })
   .catch((error) => {
     console.error('error.message' ,error.message)
   });
 
 
   responseValue = {
    pre_assigned_limit_manufacturer :  0,
    pre_assigned_limit_all_manufacturer :  0,
    avg_ticket_size :  0,
    highest_ticket_size :  0,
    avg_payment_period :  0,
    lowest_ticket_size :  0,
    relationship_tenor :  0,
    no_revolving_time :  0,
    current_overdue_amount : 0,
    historical_maximum_overdue :  0,
    current_maximum_overdue :  0,
    max_sanction_amount_allowed :  0,
    proposed_sanction_amount_total_lifting_amount :  0,
    total_outstanding : 0,
    avg_monthly_sales: 0,
    overdue_amount : 0 ,
    proposed_sanction_limit_by_system:0
    }

   return data ?? responseValue
   }else{
    // responseValue ={
    //   'success': false , 'data':'One Rmn Account Not Found'
    // }
    responseValue = {
      pre_assigned_limit_manufacturer :  0,
      pre_assigned_limit_all_manufacturer :  0,
      avg_ticket_size :  0,
      highest_ticket_size :  0,
      avg_payment_period :  0,
      lowest_ticket_size :  0,
      relationship_tenor :  0,
      no_revolving_time :  0,
      current_overdue_amount : 0,
      historical_maximum_overdue :  0,
      current_maximum_overdue :  0,
      max_sanction_amount_allowed :  0,
      proposed_sanction_amount_total_lifting_amount :  0,
      total_outstanding : 0,
      avg_monthly_sales: 0,
      overdue_amount : 0 ,
      proposed_sanction_limit_by_system:0
    }
   }
   return responseValue
};


const getOneRmn  =async (nid , manuId) =>{
  return await knex
  .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
  .select()
  .where("retailer_nid", nid) 
  // AND "manufacturer_id", manuId;
  .where("manufacturer_id", manuId).first();
}

const getManuByretailerData  =async (nid) =>{
  return await knex
  .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
  .count("cr_retailer_manu_scheme_mapping.id as count")
  .select(knex.raw('SUM("cr_retailer_manu_scheme_mapping"."propose_limit") AS total_amount') , )
  .where("retailer_nid", nid).first();
}

const getAllDisDataCount  =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_retailer_loan_calculation")
  .select()
  .count("cr_retailer_loan_calculation.id as count")
  .where("onermn_acc", oneRmn)
  .where("transaction_type", 'DISBURSEMENT').first() ?? []
}

const getAllRepDataCount  =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_retailer_loan_calculation")
  .select()
  // .count("cr_retailer_loan_calculation.id as count")
  .where("onermn_acc", oneRmn)
  .where("transaction_type", 'REPAYMENT').orderBy("id", "asc") ?? [];
}

const getAllRepData  =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
  .select('disbursement_id')
  .where("one_rmn_account", oneRmn).distinct() ?? []
}

const getCountTicketSize =async (dis_id) =>{
  return  await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
  .count("cr_loan_principal_repayment_sequence.disbursement_id as count")
  .where("disbursement_id", dis_id).first() ?? []
} 

const getTotal = (arr) => {
  let total = 0
  for (let i = 0; i < arr.length; i++) {
      total += arr[i];
  }
  return total ?? 0
}

const getTotalClosedLoan  =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
  .count("cr_loan_principal_repayment_sequence.id as count")
  .where("rest_of_principal_amount", 0)
  .where("one_rmn_account", oneRmn).first() ?? []
}

var findCurrOverDueAmount =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_disbursement")
  .where("dis_status", 0).orderBy("id", "asc")
  .where("onermn_acc", oneRmn).first() ?? []
}

var findCurrMaxOverDueAmount =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_disbursement")
  .select(knex.raw('MAX("cr_disbursement"."overdue_amount") AS maxAmount') , )
  .where("dis_status", 0).orderBy("id", "asc")
  .where("onermn_acc", oneRmn).first() ?? []
}

var findHisMaxOverDueAmount =async (oneRmn) =>{
  return  await knex("APSISIPDC.cr_overdue_amount")
  .select(knex.raw('MAX("cr_overdue_amount"."overdue_amount") AS maxAmount') , )
  .where("onermn", oneRmn).first() ?? []
}

var getTotalOutstanding = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .orderBy("id", "desc")
    .first();
};

var getTotalOverdueAmount =async (onermn_acc) =>{
  return await knex
  .from("APSISIPDC.cr_disbursement")
  .select(knex.raw('SUM("cr_disbursement"."overdue_amount") AS total_amount') , )
  .where("dis_status", 0)
  .where("onermn_acc", onermn_acc).first();
}
// @Ashik RETAILER AVERAGE END