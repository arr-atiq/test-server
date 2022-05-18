const fs = require('fs');
const express = require('express');
const readXlsxFile = require('read-excel-file/node');
const xlsx = require('xlsx');
const moment = require('moment');
const { sendApiResult, uploaddir } = require('./helperController');
const distModel = require('../Models/DistributorModel');

exports.uploadDistributorOnboardingFile = async (req, res) => {
  const upload = await importExcelData2DB(req.file.filename, req.body);
  res.status(200).send(upload);
};

const importExcelData2DB = async function (filename, req) {
  try {
    let resData = [];
    const folder_name = req.file_for;
    const workbook = xlsx.readFile(
      `./public/configuration_file/${folder_name}/${filename}`,
      { type: 'array' },
    );
    const sheetnames = Object.keys(workbook.Sheets);
    let i = sheetnames.length;
    while (i--) {
      const sheetname = sheetnames[i];
      arrayName = sheetname.toString();
      resData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
      var insert = await distModel.insertExcelData(resData, filename, req);
    }
    return insert;
  } catch (error) {
    return sendApiResult(false, 'File not uploaded');
  }
};

// @Arfin

exports.getDistributorList = async (req, res) => {
  try {
    const result = await distModel.getDistributorList(req.body);
    res.status(200).send(result);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
};

exports.deleteDistributor = async (req, res) => {
  try {
    const distributor = await distModel.deleteDistributor(req.params);
    res.status(200).send(distributor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
}

exports.editDistributor = async (req, res) => {
  try {
    const distributor = await distModel.editDistributor(req);
    res.status(200).send(distributor);
  } catch (error) {
    res.send(sendApiResult(false, error.message));
  }
}