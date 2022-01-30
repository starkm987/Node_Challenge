const fs = require('fs')
const path = require('path');
const axios = require('axios').default;
const axiosRetry = require('axios-retry');
const crypto = require("crypto");
const jsdom = require("jsdom");
const prompt = require('prompt');

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

process.on('uncaughtException', err => {
  console.error('There was an uncaught error', err);
  process.exit(1); 
})

/* files = fs.readdirSync(__dirname);
  
console.log("fileovi:");
files.forEach(file => {
  if (path.extname(file) == ".txt")
    console.log(file);
}) */
  
prompt.start();

prompt.get(['path'], function (err, result) {
  if (err) {
    return onErr(err);
  }
  
  filename = result.path;
   
  try{
    
    function initData(file){
      
      d = fs.readFileSync("./" + file).toString();

      urlFiltered = inputParser(d);
  
      urlValid = validateUrl(urlFiltered);
    }

    initData(filename);
  }
  catch(err)
  {
    console.log(err);
  }
  
  try{
  axios.get(urlValid)
    .then(function (response) {
        
    const dom = new jsdom.JSDOM(response.data);
    
    const element = dom.window.document.title;
      if (element) {
        titleFiltered = element;
      }
      else{
        titleFiltered = null;
      }
        
    let email = response.data.match(emailReg);
    
      if(email !== null)
      {
        let firstEmail = email[0];
        hash = sha256Hasher.update(firstEmail).digest("hex");
      }
      else
      {
        hash = null;
      }
                  
      outputJSON = {
        url: urlFiltered,
        title: titleFiltered,
        email: hash
      }  
  })
  .catch(function (error) {
    
    console.log(error);    
  })
  .then(function () {
    
    function clean(text) {
      let o = Object.fromEntries(Object.entries(text).filter(([_, v]) => v != null));
      let output = JSON.stringify(o);
      return output;
    }
  
    let outputData = clean(outputJSON);
            
    fs.writeFile('output', outputData, (err) => {
      if (err) throw err;
      console.log('Data written to file');
    });
      
  })
  }
  catch(err){
    console.log(err);
  }

});

function inputParser(inputData) {
  
    let escapeArr = inputData.replace(/\\\[(.*)\]/g, '');
    
    let result = escapeArr.match(reg);
    result.forEach(element => 
      {
        let subArr = element.replace(/\[(.*)\]/g, '');
        //console.log(subArr);
        
        let subUrl = subArr.match(urlReg);
        //console.log(subUrl);
       
        url = subUrl[subUrl.length-1];
                
      }
    );
     
  return url;
}

function validateUrl(inputUrl) {
  if(inputUrl.indexOf('https://') !== 0)
    inputUrl = 'https://' + inputUrl;
  return inputUrl;
}

module.exports = { inputParser };

//urlFiltered = inputParser(data);
  
//urlValid = validateUrl(urlFiltered);

/* console.log(`Watching for file changes on ${file}`);

fs.watchFile(file, (curr, prev) => {
  console.log(`${file} file Changed`);
}); */

/*
axiosRetry(axios, { retries: 1, retryDelay: 60000});

axios.get(urlValid, {
  //timeout: 50
 })
.then(function (response) {
  
  const dom = new jsdom.JSDOM(response.data);
  
  const element = dom.window.document.title;
    if (element) {
      titleFiltered = element;
    }
    else{
      titleFiltered = null;
    }
  
  
  let email = response.data.match(emailReg);
  //console.log(email);
    if(email !== null)
    {
      let firstEmail = email[0];
      hash = sha256Hasher.update(firstEmail).digest("hex");
    }
    else
    {
      hash = null;
    }
    
    //console.log(hash);
      
    outputJSON = {
      url: urlFiltered,
      title: titleFiltered,
      email: hash
    }  
})
.catch(function (error) {
  
  console.log(error);
})
.then(function () {
  
  function clean(text) {
    let o = Object.fromEntries(Object.entries(text).filter(([_, v]) => v != null));
    let output = JSON.stringify(o);
    return output;
  }

  let outputData = clean(outputJSON);
          
  fs.writeFile('output', outputData, (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });
    
})
.catch(function (error) {
  
  console.log(error);
}); */

/* const urlRequest = async () => {
  try {
    const retries = 1 
    const myConfig = {
      timeout: 500
    }
    for (let i=0; i<retries; i++) {
      try {
        const response = await axios.get(urlValid, myConfig);
        if (response) 
        {
          let email = response.data.match(emailReg);
          console.log(email);
          break;
        } 
        else 
        {
          console.log('cannot fetch data');

        }
      } 
      catch (error) 
      {
        console.log('cannot fetch data');
      }
    }
  } 
  catch (e) 
  {
    console.log(e);
  }

  
}

urlRequest(); */



 