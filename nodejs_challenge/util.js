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

function prompter(){
  
    prompt.start();
  
    // get input argument using command line prompt
    prompt.get(['path'], function (err, result) {
    if (err) {
      return onErr(err);
    }
    
    filename = result.path; //set result of user input
  
    try{
      
      const d = fs.readFileSync("./" + filename).toString(); //read the file with the filename parameter, with the relative path
  
      urlFiltered = inputParser(d); //parse data from text file using the parser function to an array
  
      urlValid = validateUrl(urlFiltered); //check if obtained URL is of valid format using validate url function
  
      getReq(urlValid); //run GET request with provided url
  
    }  
    catch(err)
    {
      console.error(err);
    }
    });
  }

  function getReq(validUrl){
  
    /* //set request retries to 1 with a delay of 60 seconds
    axiosRetry(axios, { retries: 1, retryDelay: (retryCount) => {
      return retryCount * 60000;
    }}); */
  
    try{
      axios.get(validUrl)
        .then(function (response) {
            
        const dom = new jsdom.JSDOM(response.data); //obtain DOM from the response data
        
        const element = dom.window.document.title; //extract the Title from the DOM, if no title is found set output title to null
          if (element) {
            titleFiltered = element;
          }
          else{
            titleFiltered = null;
          }
            
        let email = response.data.match(emailReg); // obtain email addresses with regex pattern of the response data, store it in an array
          
          //check if there is an email present in the email array
          if(email !== null)
          {
            let firstEmail = email[0]; //obtain first email address in the input array
            hash = sha256Hasher.update(firstEmail).digest("hex"); // hash obtained value using sha256 hasher, outputted as hex
          }
          else
          {
            hash = null; //set output email to null if not found
          }
          
          //prepare obtained data as JSON
          outputJSON = {
            url: urlFiltered,
            title: titleFiltered,
            email: hash
          }  
      })
      .catch(function (error) {
        
        console.error(error); //log error to stderr    
      })
      .finally(function () {
               
        const outputData = clean(outputJSON); //remove null key value pairs from JSON and prepare for write
        
        return outputData;        
        
        })
      }
      catch(err){
        console.error(err);
      }
  }

  function validateUrl(inputUrl) {
    if(inputUrl.indexOf('https://') !== 0)
      inputUrl = 'https://' + inputUrl;
    return inputUrl;
  }

  function clean(text) {
    let o = Object.fromEntries(Object.entries(text).filter(([_, v]) => v != null));
    let output = JSON.stringify(o);
    return output;
  } 
 
module.exports = { inputParser, prompter, getReq, validateUrl, clean };