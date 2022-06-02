const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helperController");
const model = require("../Models/RetailerModel");
const { default: axios } = require("axios");
const knex = require("../config/database");

/**
 * 
 * NOTE  Transaction Type : disbursment , repayment , INTERESTANDOTHERS
 * 
*/
const {HOSTIP} = process.env;

exports.insertLoanCalculation = async (req, res) => {
      let totalInterest = 0
      let totalLoan = 0
      const config = {
        headers: { 
            Authorization: `${req.headers.authorization}`,
            'Content-Type': 'application/json'
        },
      };
      const getSchemeId =await getSchemeID('0100000110084598')
      const principalAmount =await getPrincipalAmount('0100000110084598')
      const schemaGetvalue =await axios.get(`${HOSTIP}/scheme/${getSchemeId[0].scheme_id}`,config )
     
      const schemavalue = schemaGetvalue.data.data[0]

      
      const  dailyInterest = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.rate_of_interest, 2);
      const interestOfCharge = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.charge, 2);
      const interestOftherCharge = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.other_charge, 2);
      // const transscationCost = calculateTransactionCost(principalAmount.principal_outstanding , schemavalue.transaction_fee , 2)
      // const reimbursmentCost = calculateInterest(87 , 2,  10 , 2)
      
      
      // totalInterest = (parseFloat(interestValue) +  parseFloat(interestValueCharge) + parseFloat(interestValueOtherCharge) + parseFloat(reimbursmentCost)).toFixed(2)
      totalInterest = (parseFloat(dailyInterest) +  parseFloat(interestOfCharge) + parseFloat(interestOftherCharge) )
      totalLoan = parseFloat(principalAmount.total_outstanding) + parseFloat(totalInterest)
      
    //  let principalAmountAll = [...principalAmount]

     let dailyInterestValue = {...principalAmount,
      'daily_principal_interest': dailyInterest,
      'other_charge': interestOftherCharge,
       'charge': interestOfCharge,
       'total_outstanding': totalLoan,
       'processing_fee': 0,
       'transaction_type':'INTERESTANDOTHERS'
    }

     delete dailyInterestValue.id
      const createInterest = await knex("APSISIPDC.cr_retailer_loan_calculation").insert(dailyInterestValue);
      return res.send(
        sendApiResult(true, "You have Successfully Add Credit.", createInterest)
      );
      // let jsonResponse = {
      //   'dailyInterest':dailyInterest,
      //   'interestOfCharge':interestOfCharge,
      //   'interestOftherCharge':interestOftherCharge,
      //   'totalInterest':totalInterest,
      //   'totalLoan':parseFloat(totalLoan).toFixed(2)
      // }
       
      // res.send(jsonResponse)
};

exports.addCredit = async (req, res) => {
        let reqValue = req.body
         console.log(reqValue)
        const createScheme = await knex("APSISIPDC.cr_retailer_loan_calculation").insert(reqValue);
        return res.send(
          sendApiResult(true, "You have Successfully Add Credit.", createScheme)
        );
      };

exports.disbursement = async (req, res) => {
  let {retailer_id , onermn_acc  , sales_agent_id , disbursement_amount} = req.body

  /**
   * Getting Scheme Configure Data
   */
  const findSalesAgent =await findSalesrelation(sales_agent_id , retailer_id)
  const principalAmount =await getPrincipalAmount(onermn_acc)
  console.log('principalAmount',principalAmount)
  if(findSalesAgent[0]?.id){
    // const find = findSalesAgentVAlue(sales_agent_id)

    const getSchemeId =await getSchemeID(onermn_acc)
    let SchemeValue;
    if(getSchemeId){
       SchemeValue =await getSchemeValue(getSchemeId[0].scheme_id)
       console.log('getSchemeValue', SchemeValue)
    }else{
      /**
     * If scheme not found . Then in future we will hir global parameter
     */
    }


  
  
    let disbursement = {
      'retailer_id' : retailer_id,
      'sales_agent_id' : sales_agent_id,
      'disbursement_amount' : disbursement_amount,
      'transaction_fee' : disbursement_amount * (SchemeValue[0]?.processing_cost/100),
  
    }
  
    const createDisbursment = await knex("APSISIPDC.cr_disbursement").insert(disbursement).returning('id');
    if(createDisbursment) {
    var outstanding = principalAmount?.total_outstanding ?? 0
    var processingFeeValue = disbursement_amount * (SchemeValue[0]?.processing_cost/100)
    var loan = {
      'retailer_id' : retailer_id,
      'principal_outstanding' : disbursement_amount,
      'onermn_acc' : onermn_acc,
      'transaction_type' : 'DISBURSEMENT',
      'disbursement_id': createDisbursment[0],
      'total_outstanding':outstanding  + disbursement_amount,
    }

    console.log(outstanding , processingFeeValue , disbursement_amount)
    var processingFee = {
      'retailer_id' : retailer_id,
      'principal_outstanding' :principalAmount?.principal_outstanding ? (parseFloat(principalAmount.principal_outstanding) + disbursement_amount) : disbursement_amount ,
      'onermn_acc' : onermn_acc,
      'transaction_type' : 'PROCESSFEE',
      'disbursement_id': createDisbursment[0],
      'processing_fee':processingFeeValue,
      'total_outstanding':outstanding + processingFeeValue + disbursement_amount,
    }
    console.log('processingFee',processingFee)
  
    await knex("APSISIPDC.cr_retailer_loan_calculation").insert(loan).then(async ()=>{
        await knex("APSISIPDC.cr_retailer_loan_calculation").insert(processingFee)
    });
  
    }
    return res.send(
      sendApiResult(true, "You have Successfully Add Credit.", createDisbursment)
    );
  }else{
    return res.send(
      sendApiResult(false, "No relation Between Sales Agent And Retailer.")
    );
  }
  
};




var calculateInterest = function (total, days, ratePercent, roundToPlaces) {
  var interestRate = ((ratePercent/100));
  return ((days/360)*total*interestRate).toFixed(roundToPlaces);
}


var calculateTransactionCost = function (total, ratePercent, roundToPlaces) {
  var transactionRestRate = ((ratePercent/100));
  return (total*transactionRestRate).toFixed(roundToPlaces);
}


var getSchemeID =async (onermn_acc) => {
  return await knex
  .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
  .select()
  .where("ac_number_1rmn", onermn_acc)
}

var getSchemeValue =async (id) => {
  return await knex
  .from("APSISIPDC.cr_schema")
  .select()
  .where("id", id)
}

var findSalesrelation =async (sales_agent_id , retailer_id) => {
  return await knex
  .from("APSISIPDC.cr_retailer_vs_sales_agent")
  .select('id')
  .where("sales_agent_id", sales_agent_id).andWhere('retailer_id', retailer_id)
}

var getPrincipalAmount =async (onermn_acc) => {
  return await knex
  .from("APSISIPDC.cr_retailer_loan_calculation")
  .select()
  .where("onermn_acc", onermn_acc).orderBy('id', 'desc').first()
}


