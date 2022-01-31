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

//global variables - used to avoid issues with scope for this project
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

  prompt.message = 'Enter filename: ';
  
  // get input argument using command line prompt
  prompt.get(['userInput'], function (err, result) {
  if (err) {
    return onErr(err);
  }
  
  //set result of user input as filename parameter for parsing function
  filename = result.userInput; 

  try{
    //read the file with the filename parameter, with the relative path
    const d = fs.readFileSync("./" + filename).toString(); 
    
    //parse data from text file using the parser function to an array
    urlFiltered = inputParser(d); 
    
    //check if obtained URL is of valid format using validate url function
    urlValid = validateUrl(urlFiltered); 
    
    //run GET request with provided url
    getReq(urlValid); 

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
function getReq(validUrl){
  
  //set request retries to 1 with a delay of 60 seconds
  axiosRetry(axios, { retries: 1, retryDelay: (retryCount) => {
    return retryCount * 60000;
  }});

  try{
    axios.get(validUrl)
      .then(function (response) {
      
        //obtain DOM access from the response data    
      const dom = new jsdom.JSDOM(response.data); 
      
      //extract the Title from the DOM, if no title is found set output title to null
      const element = dom.window.document.title; 
        if (element) {
          titleFiltered = element;
        }
        else{
          titleFiltered = null;
        }
      
        // obtain email addresses with regex pattern of the response data, store it in an array    
      let email = response.data.match(emailReg); 
        
        //check if there is an email present in the email array
        if(email !== null)
        { 
          //obtain first email address in the input array
          let firstEmail = email[0]; 

          // hash obtained value using sha256 hasher, outputted as hex
          hash = sha256Hasher.update(firstEmail).digest("hex"); 
        }
        else
        {
          //set output email to null if not found
          hash = null; 
        }
        
        //prepare obtained data as JSON
        outputJSON = {
          url: urlFiltered,
          title: titleFiltered,
          email: hash
        }  
    })
    .catch(function (error) {
      
      //log error to stderr 
      console.error(error);    
    })
    .finally(function () {
        
      //remove null key value pairs from JSON and prepare for write
      const outputData = clean(outputJSON); 
      
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
    
  //check input data for an escape character
    let escapeArr = inputData.replace(escReg, ''); 
    
    // after checking for escape characters, use regex to detect brackets
    let result = escapeArr.match(reg); 
    if (result !== null) { 
      result.forEach(element => 
        {
          //filter out all nested brackets
          let subArr = element.replace(repReg, ''); 
          
          //use regex pattern to find urls and write them to a list
          let subUrl = subArr.match(urlReg); 
           
          //use the last element of the url list as output url
          url = subUrl[subUrl.length-1]; 
                  
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

/** Function for removing null fields from output JSON table */
function clean(text) {
  let o = Object.fromEntries(Object.entries(text).filter(([_, v]) => v != null));
  let output = JSON.stringify(o);
  return output;
}

//run script
prompter(); 

module.exports = { inputParser, validateUrl }; 