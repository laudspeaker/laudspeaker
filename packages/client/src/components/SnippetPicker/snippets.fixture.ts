import { SnippetMode } from "./SnippetPicker";

export const createSnippet = (apiKey: string, mode: SnippetMode) => {
  switch (mode) {
    case SnippetMode.JS_FETCH:
      return `var myHeaders = new Headers();
myHeaders.append("Authorization", "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://api.laudspeaker.com/events/", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));`;
    case SnippetMode.JS_JQUERY:
      return `$.ajax({
  url: "https://api.laudspeaker.com/events/",
  method: "POST",
  headers: {
    "Authorization": "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD",
    "Content-Type": "application/json"
  },
  data: JSON.stringify({
    "correlationKey": "email",
    "correlationValue": "mahamad@trytachyon.com",
    "source": "custom",
    "event": "failure",
    "payload": {
      "firstName": "Mahamad",
      "middleName": "Alli",
      "lastName": "Charawi"
    }
  }),
  success: function(result) {
    console.log(result);
  },
  error: function(error) {
    console.log('error', error);
  }
});
`;
    case SnippetMode.JS_XHR:
      return `// WARNING: For POST requests, body is set to null by browsers.
var xhr = new XMLHttpRequest();
xhr.open("POST", "https://api.laudspeaker.com/events/", true);
xhr.setRequestHeader("Authorization", "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD");
xhr.setRequestHeader("Content-Type", "application/json");

xhr.onreadystatechange = function() {
  if (xhr.readyState == 4) {
    if (xhr.status == 200) {
      console.log(xhr.responseText);
    } else {
      console.log('error', xhr.statusText);
    }
  }
};

xhr.send(JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
}));
`;
    case SnippetMode.NODEJS_AXIOS:
      return `const axios = require('axios');

axios.post("https://api.laudspeaker.com/events/", {
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
}, {
  headers: {
    "Authorization": "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD",
    "Content-Type": "application/json"
  }
}).then(response => {
  console.log(response.data);
}).catch(error => {
  console.log('error', error);
});
`;
    case SnippetMode.NODEJS_NATIVE:
      return `const https = require('https');

const data = JSON.stringify({
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
});

const options = {
  hostname: 'api.laudspeaker.com',
  path: '/events/',
  method: 'POST',
  headers: {
    "Authorization": "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD",
    "Content-Type": "application/json",
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log(responseBody);
  });
});

req.on('error', (error) => {
  console.log('error', error);
});

req.write(data);
req.end();
`;
    case SnippetMode.NODEJS_REQUEST:
      return `const request = require('request');

request({
  url: "https://api.laudspeaker.com/events/",
  method: "POST",
  headers: {
    "Authorization": "Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "correlationKey": "email",
    "correlationValue": "mahamad@trytachyon.com",
    "source": "custom",
    "event": "failure",
    "payload": {
      "firstName": "Mahamad",
      "middleName": "Alli",
      "lastName": "Charawi"
    }
  })
}, function(error, response, body) {
  if (error) {
    console.log('error', error);
  } else {
    console.log(body);
  }
});
`;
    case SnippetMode.PYTHON_HTTP_CLIENT:
      return `import http.client
import json

conn = http.client.HTTPSConnection("api.laudspeaker.com")

headers = {
    'Authorization': 'Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD',
    'Content-Type': 'application/json'
}

payload = json.dumps({
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
})

conn.request("POST", "/events/", payload, headers)
res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
`;
    case SnippetMode.PYTHON_REQUESTS:
      return `import requests
import json

url = "https://api.laudspeaker.com/events/"

headers = {
    'Authorization': 'Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD',
    'Content-Type': 'application/json'
}

payload = {
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
}

response = requests.post(url, headers=headers, data=json.dumps(payload))

print(response.text)
`;
    case SnippetMode.CURL:
      return `curl -X POST \
https://api.laudspeaker.com/events/ \
-H 'Authorization: Api-Key yeuZ5yhTLBhk53aWLuRGAj36bD0jXvKp0KNdWqgD' \
-H 'Content-Type: application/json' \
-d '{
  "correlationKey": "email",
  "correlationValue": "mahamad@trytachyon.com",
  "source": "custom",
  "event": "failure",
  "payload": {
    "firstName": "Mahamad",
    "middleName": "Alli",
    "lastName": "Charawi"
  }
}'
    `;
    default:
      return "";
  }
};
