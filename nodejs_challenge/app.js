const fs = require('fs')
const axios = require('axios').default;
const axiosRetry = require('axios-retry');
const crypto = require("crypto");
const jsdom = require("jsdom");
const prompt = require('prompt');

//constants for regular expressions and hashing
const escReg = /\\\[(.*)\]/g;
const repReg = /\[(.*)\]/g;
const reg = /(?<=\[).+(?=\])/g;
const urlReg = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g
const emailReg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
const secret_present = 'IM_SECRET';
const sha256Hasher = crypto.createHmac("sha256", secret_present);

//variables for storing filtered data
let urlFiltered = '';
let urlValid = ''; 
let titleFiltered = '';
let outputJSON = {};
let hash = '';
let filename = '';

/** Function for getting user input through the command line
 * sets filename as parameter for the file system read sync, then parses the input data from the file and makes a GET request
*/

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

    getReq(); //run GET request with provided url

  }  
  catch(err)
  {
    console.error(err);
  }
  });
}

/** Function for making GET request to the server using the validated input URL
 *  uses Axios http client for the get function, and Axios-retry for handling the response
 *  JSDOM is used for obtaining the response DOM structure, to obtain the Title element value  
 */
function getReq(){
  
  //set request retries to 1 with a delay of 60 seconds
  axiosRetry(axios, { retries: 1, retryDelay: (retryCount) => {
    return retryCount * 60000;
  }});

  try{
    axios.get(urlValid)
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
      
      //write output JSON table to text file in project folder, named Output.txt
      fs.writeFile('output', outputData, (err) => {
        if (err) throw err;
        console.log('Data written to file');
      });
      
      })
    }
    catch(err){
      console.error(err);
    }
}

/** Function for parsing data obtained from the text file
 *  uses regular expressions to detect urls present according to specifications
 *  returns a url to be validated and used as a parameter in the http request
 */
function inputParser(inputData) {
  
    let escapeArr = inputData.replace(escReg, ''); //check input data for an escape character
    
    let result = escapeArr.match(reg); // after checking for escape characters, use regex to detect brackets
    if (result !== null) { 
      result.forEach(element => 
        {
          let subArr = element.replace(repReg, ''); //filter out all nested brackets
                    
          let subUrl = subArr.match(urlReg); //use regex pattern to find urls and write them to a list
                   
          url = subUrl[subUrl.length-1]; //use the last element of the url list as output url
                  
        }
      );

      return url;
    }
    else {
      // if there are no adresses found with regex, default the url to www.google.com
      console.log('URL not found, defaulting to www.google.com');
      url = 'www.google.com';
      return url;
    }          
 
}

/** Function for simple validation of url
 *  Checks if input url begins with 'https://', and adds it to the beginning of the url if required
 *  This format is required for the http request url
 *  Does not validate urls beginning with something other than www. :(
 *   */
function validateUrl(inputUrl) {
  if(inputUrl.indexOf('https://') !== 0)
    inputUrl = 'https://' + inputUrl;
  return inputUrl;
}

/** Function for removing null fields from JSON table */
function clean(text) {
  let o = Object.fromEntries(Object.entries(text).filter(([_, v]) => v != null));
  let output = JSON.stringify(o);
  return output;
}

prompter(); //run script

module.exports = { inputParser, validateUrl }; 