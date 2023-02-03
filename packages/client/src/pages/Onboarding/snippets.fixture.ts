import { SnippetMode } from "./OnboardingBeta";

export const createSnippet = (apiKey: string, mode: SnippetMode) => {
  switch (mode) {
    case SnippetMode.JS_FETCH:
      return `var myHeaders = new Headers();
myHeaders.append("Authorization", "Api-Key ${apiKey}");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("http://localhost:3001/events", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));`;
    case SnippetMode.JS_JQUERY:
      return `var settings = {
  "url": "http://localhost:3001/events",
  "method": "POST",
  "timeout": 0,
  "headers": {
    "Authorization": "Api-Key ${apiKey}",
    "Content-Type": "application/json"
  },
  "data": JSON.stringify({
    "correlationKey": "email",
    "correlationValue": "testmail@gmail.com",
    "event": {
      "a": "a"
    }
  }),
};

$.ajax(settings).done(function (response) {
  console.log(response);
});`;
    case SnippetMode.JS_XHR:
      return `// WARNING: For POST requests, body is set to null by browsers.
var data = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
});

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function() {
  if(this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:3001/events");
xhr.setRequestHeader("Authorization", "Api-Key ${apiKey}");
xhr.setRequestHeader("Content-Type", "application/json");

xhr.send(data);`;
    case SnippetMode.NODEJS_AXIOS:
      return `var axios = require('axios');
var data = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
});

var config = {
  method: 'post',
  url: 'http://localhost:3001/events',
  headers: { 
    'Authorization': 'Api-Key ${apiKey}', 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});`;
    case SnippetMode.NODEJS_NATIVE:
      return `var http = require('follow-redirects').http;
var fs = require('fs');

var options = {
  'method': 'POST',
  'hostname': 'localhost',
  'port': 3001,
  'path': '/events',
  'headers': {
    'Authorization': 'Api-Key ${apiKey}',
    'Content-Type': 'application/json'
  },
  'maxRedirects': 20
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });

  res.on("error", function (error) {
    console.error(error);
  });
});

var postData = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
});

req.write(postData);

req.end();`;
    case SnippetMode.NODEJS_REQUEST:
      return `var request = require('request');
var options = {
  'method': 'POST',
  'url': 'http://localhost:3001/events',
  'headers': {
    'Authorization': 'Api-Key ${apiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "correlationKey": "email",
    "correlationValue": "testmail@gmail.com",
    "event": {
      "a": "a"
    }
  })

};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});`;
    case SnippetMode.PYTHON_HTTP_CLIENT:
      return `import http.client
import json

conn = http.client.HTTPSConnection("localhost", 3001)
payload = json.dumps({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
})
headers = {
  'Authorization': 'Api-Key ${apiKey}',
  'Content-Type': 'application/json'
}
conn.request("POST", "/events", payload, headers)
res = conn.getresponse()
data = res.read()
print(data.decode("utf-8"))`;
    case SnippetMode.PYTHON_REQUESTS:
      return `import requests
import json

url = "http://localhost:3001/events"

payload = json.dumps({
  "correlationKey": "email",
  "correlationValue": "testmail@gmail.com",
  "event": {
    "a": "a"
  }
})
headers = {
  'Authorization': 'Api-Key ${apiKey}',
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)`;
    case SnippetMode.CURL:
      return `curl --location --request POST 'http://localhost:3001/events' \
--header 'Authorization: Api-Key ${apiKey}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "correlationKey": "email",
    "correlationValue": "testmail@gmail.com",
    "event": {
        "a": "a"
    }
}'`;
    default:
      return "";
  }
};
