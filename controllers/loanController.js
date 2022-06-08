const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helperController");
const model = require("../Models/Retailer");
const { default: axios } = require("axios");
const knex = require("../config/database");
// var moment = require('moment');

/**
 * 
 * NOTE  Transaction Type : disbursment , repayment , INTERESTANDOTHERS , EXPIRYINTEREST , TRANSACTION
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
      const getSchemeId =await getSchemeID('0100000110084342')
      const principalAmount =await getPrincipalAmount('0100000110084342')
      const schemaGetvalue =await axios.get(`${HOSTIP}/scheme/${getSchemeId[0].scheme_id}`,config )
      const schemavalue = schemaGetvalue.data.data[0]
     
      var date = moment(schemavalue?.expiry_date?.split('T')[0])
      var now = moment();
      var checkExpiry = false
      if (now > date) {
        checkExpiry = true
      } else {
        checkExpiry = false

      }

      if(checkExpiry){
        const interestAfterExpiryOverdue = calculateInterest(principalAmount.total_outstanding, 1, schemavalue.overdue_amount, 2);
        const interestAfterExpiryPenal = calculateInterest(principalAmount.total_outstanding, 1, schemavalue.penal_charge, 2);

        totalInterest = (parseFloat(interestAfterExpiryOverdue) +  parseFloat(interestAfterExpiryPenal))
        totalLoan = parseFloat(principalAmount.total_outstanding) + parseFloat(totalInterest) 

        let expiryInterestValue = {
          'overdue_amount': interestAfterExpiryOverdue,
          'penal_charge':interestAfterExpiryPenal,
          'principal_outstanding':parseFloat(principalAmount.principal_outstanding),
          'retailer_id': principalAmount.retailer_id,
          'onermn_acc': principalAmount.onermn_acc,
          // 'disbursement_id': principalAmount.disbursement_id,
          'total_outstanding':totalLoan,
          // 'transaction_cost_type':principalAmount.transaction_cost_type,
          'transaction_type':'EXPIRYINTEREST'
        }
       
       
        const createInterestExpiry = await knex("APSISIPDC.cr_retailer_loan_calculation").insert(expiryInterestValue);
        return res.send(
          sendApiResult(true, "You have Successfully Add Credit.", createInterestExpiry)
        );
      }else{
        const  dailyInterest = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.rate_of_interest, 2);
        const interestOfCharge = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.charge, 2);
        const interestOftherCharge = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.other_charge, 2);
        const interestOfreimbursment = calculateInterest(principalAmount.principal_outstanding, 1, schemavalue.reimbursment_cost, 2);
  
  
        totalInterest = (parseFloat(dailyInterest) +  parseFloat(interestOfCharge) + parseFloat(interestOftherCharge) + parseFloat(interestOfreimbursment) )
        totalLoan = parseFloat(principalAmount.total_outstanding) + parseFloat(totalInterest) + parseFloat(interestOfreimbursment)
        
  
       let dailyInterestValue = {
        //  ...principalAmount,
        'retailer_id':principalAmount.retailer_id,
        'onermn_acc':principalAmount.onermn_acc,
        'retailer_id':principalAmount.retailer_id,
        'retailer_id':principalAmount.retailer_id,
        'principal_outstanding':principalAmount.principal_outstanding,
        'daily_principal_interest': dailyInterest,
        'interest_reimbursment':interestOfreimbursment,
        'other_charge': interestOftherCharge,
         'charge': interestOfCharge,
         'total_outstanding': totalLoan,
        //  'transaction_cost_type':principalAmount.transaction_cost_type,
         'processing_fee': 0,
         'transaction_type':'INTERESTANDOTHERS'
      }
  
       delete dailyInterestValue.id
       delete dailyInterestValue.overdue_amount
       delete dailyInterestValue.penal_charge

        const createInterest = await knex("APSISIPDC.cr_retailer_loan_calculation").insert(dailyInterestValue);
        return res.send(
          sendApiResult(true, "You have Successfully Add Credit.", createInterest)
        );
      }
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
  let {retailer_id , onermn_acc  , sales_agent_id , disbursement_amount } = req.body

  /**
   * Getting Scheme Configure Data
   */
  const findSalesAgent =await findSalesrelation(sales_agent_id , retailer_id)
  const principalAmount =await getPrincipalAmount(onermn_acc)
  const getLimitAmountValue =await getLimitAmount(onermn_acc)
  var slab = false;
  // console.log('getLimitAmountValue',getLimitAmountValue[0]?.crm_approve_limit > disbursement_amount)
  let totalLimit = parseInt(getLimitAmountValue[0]?.crm_approve_limit) - parseInt(getLimitAmountValue[0]?.current_limit)
  console.log('findSalesAgent',findSalesAgent)
  if(findSalesAgent[0]?.id){
     if(totalLimit > disbursement_amount){
      const getSchemeId =await getSchemeID(onermn_acc)
      let SchemeValue;
      if(getSchemeId){
         SchemeValue =await getSchemeValue(getSchemeId[0].scheme_id)
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
      // var transsactionFeeValue = 0;
      // if(slab){
      // }else{
      //   transsactionFeeValue = disbursement_amount * (SchemeValue[0]?.transaction_fee/100) ?? 0
      // }

      var loan = {
        'retailer_id' : retailer_id,
        'principal_outstanding' : disbursement_amount,
        'disburshment' : disbursement_amount,
        'onermn_acc' : onermn_acc,
        'transaction_type' : 'DISBURSEMENT',
        'disbursement_id': createDisbursment[0],
        'total_outstanding':outstanding  + disbursement_amount
        // 'transaction_cost_type':transaction_cost_type
      }
      
      var limitUpdate = {
        current_limit: parseFloat(getLimitAmountValue[0]?.current_limit) + parseFloat(disbursement_amount)
      }
      var processingFee = {
        'retailer_id' : retailer_id,
        'principal_outstanding' :principalAmount?.principal_outstanding ? (parseFloat(principalAmount.principal_outstanding) + disbursement_amount) : disbursement_amount ,
        'onermn_acc' : onermn_acc,
        'transaction_type' : 'PROCESSFEE',
        'disbursement_id': createDisbursment[0],
        'processing_fee':processingFeeValue,
        'total_outstanding':outstanding + processingFeeValue + disbursement_amount
        // 'transaction_cost_type':transaction_cost_type
      }


      // var transsactionFee = {
      //   'retailer_id' : retailer_id,
      //   'principal_outstanding' :principalAmount?.principal_outstanding ? (parseFloat(principalAmount.principal_outstanding) + disbursement_amount) : disbursement_amount ,
      //   'onermn_acc' : onermn_acc,
      //   'transaction_type' : 'TRANSACTIONFEE',
      //   'disbursement_id': createDisbursment[0],
      //   'transaction_cost':transsactionFeeValue,
      //   'total_outstanding':outstanding + processingFeeValue + disbursement_amount + transsactionFeeValue,
      // }
    
      await knex("APSISIPDC.cr_retailer_loan_calculation").insert(loan).then(async ()=>{
          await knex("APSISIPDC.cr_retailer_loan_calculation").insert(processingFee).then(async ()=>{
            await knex.transaction(async (trx) => {
              // await knex("APSISIPDC.cr_retailer_loan_calculation").insert(transsactionFee).then(async ()=>{
              const limit_update = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
                .where({ ac_number_1rmn: onermn_acc })
                .update(
                  limitUpdate
                );
                console.log('limit_update',limit_update)
              if (limit_update <= 0){
                return res.send((sendApiResult(false, "failed to update one rmn account ")));
              }
            // });
            });
          })
      });
    
      }
      return res.send(
        sendApiResult(true, "You have Successfully Add Credit.", processingFee)
      );
     }else{
        return res.send(sendApiResult(false, "Disbursement is higher than propose limit."))
    }
  }else{
    return res.send(
      sendApiResult(false, "No relation Between Sales Agent And Retailer.")
    );  }  
};

exports.repayment = async (req, res) => {
  let {retailer_id , onermn_acc  , sales_agent_id , repayment , transaction_cost} = req.body
  // let transaction_cost = transaction_cost_value;
  const findSalesAgent =await findSalesrelation(sales_agent_id , retailer_id)
  const principalAmount =await getPrincipalAmount(onermn_acc)
  const getLimitAmountValue =await getLimitAmount(onermn_acc)
  const getSlabDateValue = await getSlabDate(onermn_acc)
  const dateSlab = getSlabDateValue?.created_at
  var getSchemeId =await getSchemeID(onermn_acc)
  var SchemeValue;
  if(getSchemeId){
    SchemeValue =await getSchemeValue(getSchemeId[0].scheme_id)
  }else{
    /**
    * If scheme not found . Then in future we will hir global parameter
    */
  }

  if(principalAmount?.total_outstanding >= repayment ){
    let repaymentType = {
      'retailer_id' : retailer_id,
      'sales_agent_id' : sales_agent_id,
      'disbursement_amount':0,
      'transaction_fee':0,
      'repayment' : repayment,
    }

    const createRepayment = await knex("APSISIPDC.cr_disbursement").insert(repaymentType).returning('id');
    if(createRepayment) {
    // if(getSchemeId[0]?.transaction_type == 'SLAB'){
    //   const now = moment.utc();
    //   var end = moment(dateSlab); 
    //   var days = now.diff(end, "days"); 
    //   const getSlabValue =await getSlabAmount(repayment , days )
    //   transaction_cost = getSlabValue[0]?.transaction_fee ?? 0
    // }else{
    //   transaction_cost = repayment * (SchemeValue[0]?.transaction_fee/100) ?? 0
    // }
  
    let calculateRepaymentInterest =( parseFloat(principalAmount.total_outstanding) - parseFloat(principalAmount.principal_outstanding)).toFixed(2)
  
    var intersetPaid = 0;
  
    if(calculateRepaymentInterest > repayment){
      intersetPaid = parseFloat(calculateRepaymentInterest) - parseFloat(repayment)
    }else{
      intersetPaid = parseFloat(repayment) - parseFloat(calculateRepaymentInterest)
    }
  
    // let dailyInterestValue = {...principalAmount,
    let repaymentValueAll = {
       'principal_outstanding': calculateRepaymentInterest > repayment ? (parseFloat(principalAmount.principal_outstanding)) :
       (parseFloat(principalAmount.principal_outstanding) - parseFloat(intersetPaid)),
       'retailer_id': principalAmount.retailer_id,
       'onermn_acc': principalAmount.onermn_acc,
       'disbursement_id': principalAmount.disbursement_id,
       'total_outstanding': (parseFloat(principalAmount.total_outstanding) - repayment) ,
       'repayment' :repayment,
      //  'transaction_cost_type':principalAmount.transaction_cost_type,
       'transaction_cost':parseFloat(transaction_cost),
       'transaction_type':'REPAYMENT'
    }
  //   let transactionCost = {
  //     'principal_outstanding': calculateRepaymentInterest > repayment ? (parseFloat(principalAmount.principal_outstanding)) :
  //     (parseFloat(principalAmount.principal_outstanding) - parseFloat(intersetPaid)),
  //     'retailer_id': principalAmount.retailer_id,
  //     'onermn_acc': principalAmount.onermn_acc,
  //     'disbursement_id': createRepayment[0],
  //     'total_outstanding': (parseFloat(principalAmount.total_outstanding) - repayment) + parseFloat(transaction_cost) ,
  //     'transaction_cost_type':principalAmount.transaction_cost_type,
  //     'transaction_cost':parseFloat(transaction_cost),
  //     'transaction_type':'TRANSACTION'
  //  }
  
    var limitUpdate = {
      current_limit: parseFloat(getLimitAmountValue[0]?.current_limit) - parseFloat(repayment) + parseFloat(calculateRepaymentInterest)
    }
  
      await knex("APSISIPDC.cr_retailer_loan_calculation").insert(repaymentValueAll).then(async ()=>{
        // await knex("APSISIPDC.cr_retailer_loan_calculation").insert(transactionCost).then(async ()=>{
          await knex.transaction(async (trx) => {
            const limit_update = await trx("APSISIPDC.cr_retailer_manu_scheme_mapping")
              .where({ ac_number_1rmn: onermn_acc })
              .update(
                limitUpdate
              );
              console.log('limit_update',limit_update)
            if (limit_update <= 0){
              return res.send((sendApiResult(false, "failed to update one rmn account ")));
             }
            });
          //  });
           return res.send((sendApiResult(true, "Sucessly Repayment",repaymentValueAll)));
      });
    }
  
    let totalLimit = parseInt(getLimitAmountValue[0]?.crm_approve_limit) - parseInt(getLimitAmountValue[0]?.current_limit)
  }else{
    return res.send((sendApiResult(false, "Repayment is higher than Total Outstanding")));
  }
};

exports.slab = async (req, res) => {
  let { onermn_acc , repayment } = req.query
  console.log('req.params',req.query)
  const getSlabDateValue = await getSlabDate(onermn_acc)
  const dateSlab = getSlabDateValue?.created_at
  let transaction_cost = 0;
  var getSchemeId =await getSchemeID(onermn_acc)
  var SchemeValue;
  if(getSchemeId){
    SchemeValue =await getSchemeValue(getSchemeId[0]?.scheme_id)
  }else{
    /**
    * If scheme not found . Then in future we will hir global parameter
    */
  }
  console.log('SchemeValue',SchemeValue)
  if(SchemeValue[0]?.transaction_type == 'SLAB'){
      const now = moment.utc();
      var end = moment(dateSlab); 
      var days = now.diff(end, "days"); 
      const getSlabValue =await getSlabAmount(repayment , days )
      transaction_cost = getSlabValue[0]?.transaction_fee ?? 0
    }else{
      transaction_cost = repayment * (SchemeValue[0]?.transaction_fee/100) ?? 0
    }
    var value = {
      'transaction_cost' : transaction_cost
    }
    return res.send((sendApiResult(true, "Transaction Cost",value)));
};

exports.totalLoan = async (req, res) => {
  let { onermn_acc } = req.params
     let totalValue =await getPrincipalAmount(onermn_acc)
     console.log(totalValue)
     var resPonseVaslue = {
      "total_outstanding": totalValue.total_outstanding,
      "retailer_id": totalValue.retailer_id,
      "onermn_acc": totalValue.onermn_acc,
     }
     if(totalValue){
       return res.send((sendApiResult(true, "Find Total Cost",resPonseVaslue)));
     }else{
       return res.send((sendApiResult(false, "No Data Found")));
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


var getSlabDate =async (onermn_acc) => {
  return await knex
  .from("APSISIPDC.cr_retailer_loan_calculation")
  .select()
  .where("onermn_acc", onermn_acc)
  .where("transaction_type", "DISBURSEMENT")
  .orderBy('id', 'desc').first()
}

var getLimitAmount =async (onermn_acc) => {
  return await knex
  .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
  .select()
  .where("ac_number_1rmn", onermn_acc)
}

var getSlabAmount =async (repayment , days) => {
  return await knex
  .from("APSISIPDC.cr_slab")
  .select()
  .where("lower_limit","<", repayment)
  .where("upper_limit",">", repayment)
  .where("day_dis_lower_limit","<", days)
  .where("day_dis_upper_limit",">", days)


}



