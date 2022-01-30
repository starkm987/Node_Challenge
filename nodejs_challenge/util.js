const fs = require('fs')
const axios = require('axios').default;
const axiosRetry = require('axios-retry');
const crypto = require("crypto");
const jsdom = require("jsdom");
const prompt = require('prompt');

const escReg = /\\\[(.*)\]/g;
const repReg = /\[(.*)\]/g;
const reg = /(?<=\[).+(?=\])/g;
const urlReg = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g
const emailReg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
const secret_present = 'IM_SECRET';
const sha256Hasher = crypto.createHmac("sha256", secret_present);

let urlFiltered = '';
let urlValid = ''; 
let titleFiltered = '';
let outputJSON = {};
let hash = '';
let filename = '';

function inputParser(inputData) {
  
    let escapeArr = inputData.replace(escReg, '');
    
    let result = escapeArr.match(reg);
    if (result !== null) {
      result.forEach(element => 
        {
          let subArr = element.replace(repReg, '');
                    
          let subUrl = subArr.match(urlReg);
                   
          url = subUrl[subUrl.length-1];
                  
        }
      );

      return url;
    }
    else {
      console.log('URL not found, defaulting to www.google.com');
      url = 'www.google.com';
      return url;
    }          
 
}

module.exports = { inputParser };