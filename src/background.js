// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function generateRuleEntries(list_of_browserData_objects){
  var entry_list = [];
  for (const browserData_object of list_of_browserData_objects){
    
    var suffix_string = browserData_object.suffix_string;
    var relevant_browser_data = browserData_object.data;
    
    if (relevant_browser_data != null){
      for (var i=0; i<relevant_browser_data.count; i++){
        const browserEntry = relevant_browser_data.entries[i];
        entry_list.push({
          "File": browserEntry["path"] + " " + suffix_string,
          "Size": browserEntry["size"]
        })
      }
    }
  }
  return entry_list;
}

function translateResults(browserData){

  var result = {
    "report":{
      "time":10000,
      "rules":[]
    }
  }

  // generate rule for Cache (CCleaner)
  var cacheRule = {
    "LangSecRef": "3032",
    "LangRef"	: "3161",
    "entries" : generateRuleEntries([
      {"data":browserData.cache, "suffix_string":""}, 
      {"data":browserData.cacheStorage, "suffix_string":"(CacheStorage)"}, 
      {"data":browserData.appcache, "suffix_string":"(appcache)"}
    ])
  };
  result["report"]["rules"].push(cacheRule);

  // generate rule for Internet History
  var internetHistoryRule = {
    "LangSecRef":"3029",
    "LangRef":"3162l",
    "entries": generateRuleEntries([{"data":browserData.history, "suffix_string":""}])
  }
  result["report"]["rules"].push(internetHistoryRule);

  // generate rule for Download History
  var downloadHistoryRule = {
    "LangSecRef":"3029",
    "LangRef":"3163",
    "entries": generateRuleEntries([{"data":browserData.downloads, "suffix_string":""}])
  }
  result["report"]["rules"].push(downloadHistoryRule);

  // generate rule for Last Download Location (NIL)

  // generate rule for cookies
  var cookieRule = {
    "LangSecRef":"3029",
    "LangRef":"3102",
    "entries": generateRuleEntries([{"data":browserData.cookies, "suffix_string":""}])
  }
  result["report"]["rules"].push(cookieRule);

  // generate rule for Saved Form Information
  var formInfoRule = {
    "LangSecRef":"3029",
    "LangRef":"3164",
    "entries": generateRuleEntries([{"data":browserData.formData, "suffix_string":""}])
  }
  result["report"]["rules"].push(formInfoRule);

  // generate rule for Saved Passwords
  var passwordRule = {
    "LangSecRef":"3029",
    "LangRef":"3109",
    "entries": generateRuleEntries([{"data":browserData.passwords, "suffix_string":""}])
  }
  result["report"]["rules"].push(passwordRule);

  // generate rule for Session
  var sessionRule = {
    "LangSecRef":"3029",
    "LangRef":"3167",
    "entries": generateRuleEntries([
      {"data":browserData.localStorage, "suffix_string":"(localStorage)"}, 
      {"data":browserData.fileSystems, "suffix_string":"(fileSystems)"}, 
      {"data":browserData.serverBoundCertificates, "suffix_string":"(serverBoundCertificates)"}, 
      {"data":browserData.serviceWorkers, "suffix_string":"(serviceWorkers)"}])
  }
  result["report"]["rules"].push(sessionRule);

  // generate rule for Compact Databases
  var databaseRule = {
    "LangSecRef":"3029",
    "LangRef":"3165",
    "entries": generateRuleEntries([
      {"data":browserData.indexedDB, "suffix_string":"(indexedDB)"}, 
      {"data":browserData.webSQL, "suffix_string":"(webSQL)"}
    ])
  }
  result["report"]["rules"].push(databaseRule);

  return result;

}


function saveTotalRemovedFilesSize(browserData){
  var runningCount = 0
  var i
  var j

  for (i = 0; i < Object.keys(browserData).length; i++) {
      for(j = 0; j < browserData[Object.keys(browserData)[i]].count; j++){
          runningCount += browserData[Object.keys(browserData)[i]].entries[j].size
      }
  }

  // Collect current statistics first
  chrome.storage.sync.get({
    removedFileSizeData:''
  }, function(previousData){
      
      var currentTime = parseInt((new Date().getTime() / 1000).toFixed(0));

      if (previousData.removedFileSizeData == ''){
        //var data = {x: [currentTime], y:[runningCount]};
        var data = [{"x":currentTime,"y":runningCount}];
        console.log(data);
      }else{
        var data = previousData.removedFileSizeData;

        // We only want 6 data samples at a time
        if (data.length > 6){
          data.pop();
          console.log("popped");
        }
        // data.x.push(currentTime);
        // data.y.push(runningCount);
        data.push({"x":currentTime,"y":runningCount});
      }
      chrome.storage.sync.set({
        removedFileSizeData: data
      })
    });

    return runningCount;
  }


function saveSpecificDomainDataToCache(browserData){
  var getLocation = function(href) {
      var l = document.createElement("a");
      l.href = href;
      return l;
  };

  var pathDict = {}
  var i
  var j

  for (i = 0; i < Object.keys(browserData).length; i++) {
      for(j = 0; j < browserData[Object.keys(browserData)[i]].count; j++){
          var host = getLocation(browserData[Object.keys(browserData)[i]].entries[j].path).hostname
          if (host in pathDict) {
              pathDict[host] += browserData[Object.keys(browserData)[i]].entries[j].size
          }

          else{
              pathDict[host] = browserData[Object.keys(browserData)[i]].entries[j].size
          }
      }
  }

  // Create items array
  var items = Object.keys(pathDict).map(function(key) {
    return [key, pathDict[key]];
  });

  // Sort the array based on the second element
  items.sort(function(first, second) {
    return second[1] - first[1];
  });

  // Create a new array with only the first 5 items
  newData = items.slice(0, 4);

  chrome.storage.sync.set({
    specificDomainData:newData
  })
}


function iconClick() {

  var millisecondsPerHour = 1000 * 60 * 60;
  var millisecondsPerDay = millisecondsPerHour* 24 * 1;
  var oneDayAgo = (new Date()).getTime() - millisecondsPerDay;
  var sevenDaysAgo = (new Date()).getTime() - (millisecondsPerDay*7);

  // collect settings 
  chrome.storage.sync.get({
    hours_lower: 7 * 24,       // sets the lower time limit
    hours_higher: 0,           // sets the upper time limit

    preserve_login_cookies:true,
    preserve_login_cookies_list:""

  }, function(settings) {

    console.log((new Date()).getTime() - (parseInt(settings.hours_lower) * millisecondsPerHour));
    console.log((new Date()).getTime() - (parseInt(settings.hours_higher) * millisecondsPerHour));

    // if preserve_login_cookies is true, we want to use the safeCookieRemoval function to remove cookies in the whitelist
    if (settings.preserve_login_cookies){
      // Split whitelist text by new lines. 
      var whitelist = settings.preserve_login_cookies_list.split(/[\r\n]+/g);
      var removed = []
      safeCookieRemoval(whitelist, removed);
    }

    chrome.browsingData.remove({
      "since": (new Date()).getTime() - (parseInt(settings.hours_lower) * millisecondsPerHour),
      "till": (new Date()).getTime() - (parseInt(settings.hours_higher) * millisecondsPerHour) // custom for ASB
    }, {
        "appcache": true,
        "cache": true,
        "cacheStorage": true,
        "cookies": !settings.preserve_login_cookies,         // if preserve_login_cookies is true, we want to use the safeCookieRemoval() function instead, so set this to false
        "downloads": true,
        "fileSystems": true,
        "formData": true,
        "history": true,
        "indexedDB": true,
        "localStorage": true,
        "pluginData": true,
        "passwords": true,
        "serverBoundCertificates": true,
        "serviceWorkers": true,
        "webSQL": true
    }, function(result) {

      console.log(JSON.stringify(result));
  
      console.log('Clean completed!');
      console.log(result);      
      // Translate results and send to CCleaner
      var report = translateResults(result);
      //console.log(report);
      chrome.browsingData.reportCleanResults(JSON.stringify(report));

      saveTotalRemovedFilesSize(result);
      saveSpecificDomainDataToCache(result);



    });
  });

} // iconClick


// get all cookies
function getAllCookies(cookieList){

  chrome.cookies.getAllCookieStores( (cookieStoreList) => {
    for (const cookieStore of cookieStoreList){
      chrome.cookies.getAll({"storeId":cookieStore.id}, (cookies) => {
        cookieList = cookieList.concat(cookies);
      })
    }
  })

  return cookieList;
}

function buildCookieURL(cookie){
  var url = '';
  // get prefix, like https://www.
  url += cookie.secure ? 'https://' : 'http://';
  url += cookie.domain.charAt(0) == '.' ? 'www' : '';

  // append domain and path
  url += cookie.domain;
  url += cookie.path;
  return url;
}

function safeCookieRemoval(whitelist, removedCookieList){



  //var cookieList = getAllCookies();
  chrome.cookies.getAllCookieStores( (cookieStoreList) => {
    for (const cookieStore of cookieStoreList){
      chrome.cookies.getAll({"storeId":cookieStore.id}, (cookieList) => {
        for (const cookie of cookieList){          
          var url = buildCookieURL(cookie);
          var cookie_path = url + "@" + cookie.name;
          if (whitelist.includes(cookie_path)){
            continue;
          } 
          else{
            removedCookieList.push(cookie_path);
            chrome.cookies.remove({"url":url,"name":cookie.name});
          }
        }
      })
    }
  })
}



// chrome.runtime.onMessage.addListener( function (message, sender, sendResponse) {
//   console.log(message);
//   if (message.clicked) {
//     console.log("htllo");
//     iconClick();
//   }
// });

chrome.browserAction.onClicked.addListener(iconClick);


chrome.storage.sync.get({
  aggresive_caching: true,
  spoof_user_agent:true
}, function(settings) {

  if (settings.aggresive_caching){
    setInterval(iconClick,1000 * 60 * 60); // Trigger full cache removal every hour
  }

  if (settings.spoof_user_agent){
    chrome.webRequest.onBeforeSendHeaders.removeListener(spoofRandomUserAgent);
    chrome.webRequest.onBeforeSendHeaders.addListener(spoofRandomUserAgent, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);  
  }
    
});

function spoofRandomUserAgent(details){
  var random_user_agent = user_agents_list[Math.floor(Math.random() * user_agents_list.length)];

    for(var i=0; i < details.requestHeaders.length; ++i){
        if(details.requestHeaders[i].name === "User-Agent"){
            details.requestHeaders[i].value = random_user_agent;
            break;
        }
    }
    return {requestHeaders: details.requestHeaders};
}


var user_agents_list = [
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2226.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.4; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2224.3 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.93 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 4.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2049.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.67 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.67 Safari/537.36",
  "Mozilla/5.0 (X11; OpenBSD i386) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1944.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.3319.102 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2309.372 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.2117.157 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1866.237 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/4E423F",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.517 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1664.3 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1664.3 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.16 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1623.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.17 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.62 Safari/537.36",
  "Mozilla/5.0 (X11; CrOS i686 4319.74.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.57 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1468.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1467.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1464.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1500.55 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.90 Safari/537.36",
  "Mozilla/5.0 (X11; NetBSD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36",
  "Mozilla/5.0 (X11; CrOS i686 3912.101.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.60 Safari/537.17",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1309.0 Safari/537.17",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/24.0.1295.0 Safari/537.15",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.14 (KHTML, like Gecko) Chrome/24.0.1292.0 Safari/537.14",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1284.0 Safari/537.13",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.6 Safari/537.11",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.6 Safari/537.11",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.26 Safari/537.11",
  "Mozilla/5.0 (Windows NT 6.0) yi; AppleWebKit/345667.12221 (KHTML, like Gecko) Chrome/23.0.1271.26 Safari/453667.1221",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.17 Safari/537.11",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_0) AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.79 Safari/537.4",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1216.0 Safari/537.2",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1",
  "Mozilla/5.0 (X11; CrOS i686 2268.111.0) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6",
  "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/19.77.34.5 Safari/537.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5",
  "Mozilla/5.0 (X11; FreeBSD amd64) AppleWebKit/536.5 (KHTML like Gecko) Chrome/19.0.1084.56 Safari/1EA69",
  "Mozilla/5.0 (Windows NT 6.0) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.36 Safari/536.5",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
  "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1062.0 Safari/536.3"
]