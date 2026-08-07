import { SnippetMode } from "./SnippetPicker";
import { v4 as uuid } from "uuid";

export const createSnippet = (
  apiKey: string,
  firstName: string,
  lastName: string,
  email: string,
  mode: SnippetMode
) => {
  const firstUUID = uuid();
  const secondUUID = uuid();
  const distinctId = "an_example";
  const correlationValue = uuid();
  const timestamp = "2024-03-15T02:31:05.295Z";
  switch (mode) {
    case SnippetMode.JS_FETCH:
      return (
        `var myHeaders = new Headers();
myHeaders.append("Authorization", "Api-Key ` +
        apiKey +
        `");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "batch": [
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        firstUUID +
        `",
      "event": "$identify",
      "source": "mobile",
      "correlationKey": "_id",
      "payload": {
        "$anon_distinct_id": "` +
        correlationValue +
        `",
        "distinct_id": "` +
        distinctId +
        `"
      },
      "correlationValue": "` +
        correlationValue +
        `"
    },
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        secondUUID +
        `",
      "event": "$set",
      "source": "mobile",
      "correlationKey": "_id",
      "correlationValue": "` +
        correlationValue +
        `",
      "payload": {
        "mkt_agree": true
      }
    }
  ]
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://app.laudspeaker.com/api/events/batch", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));`
      );
    case SnippetMode.NODEJS_AXIOS:
      return (
        `const axios = require('axios');

axios.post("https://app.laudspeaker.com/api/events/batch", {
  "batch": [
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        firstUUID +
        `",
      "event": "$identify",
      "source": "mobile",
      "correlationKey": "_id",
      "payload": {
        "$anon_distinct_id": "` +
        correlationValue +
        `",
        "distinct_id": "` +
        distinctId +
        `"
      },
      "correlationValue": "` +
        correlationValue +
        `"
    },
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        secondUUID +
        `",
      "event": "$set",
      "source": "mobile",
      "correlationKey": "_id",
      "correlationValue": "` +
        correlationValue +
        `",
      "payload": {
        "mkt_agree": true
      }
    }
  ]
}, {
  headers: {
    "Authorization": "Api-Key ` +
        apiKey +
        `",
    "Content-Type": "application/json"
  }
}).then(response => {
  console.log(response.data);
}).catch(error => {
  console.log('error', error);
});
`
      );
    case SnippetMode.PYTHON_HTTP_CLIENT:
      return (
        `import http.client
import json

conn = http.client.HTTPSConnection("app.laudspeaker.com")

headers = {
    'Authorization': 'Api-Key ` +
        apiKey +
        `',
    'Content-Type': 'application/json'
}

payload = json.dumps({
  "batch": [
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        firstUUID +
        `",
      "event": "$identify",
      "source": "mobile",
      "correlationKey": "_id",
      "payload": {
        "$anon_distinct_id": "` +
        correlationValue +
        `",
        "distinct_id": "` +
        distinctId +
        `"
      },
      "correlationValue": "` +
        correlationValue +
        `"
    },
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        secondUUID +
        `",
      "event": "$set",
      "source": "mobile",
      "correlationKey": "_id",
      "correlationValue": "` +
        correlationValue +
        `",
      "payload": {
        "mkt_agree": true
      }
    }
  ]
})

conn.request("POST", "/api/events/batch", payload, headers)
res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))
`
      );
    case SnippetMode.CURL:
      return (
        `curl -X POST \
https://app.laudspeaker.com/api/events/batch \
-H 'Authorization: Api-Key ` +
        apiKey +
        `' \
-H 'Content-Type: application/json' \
-d '{
  "batch": [
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        firstUUID +
        `",
      "event": "$identify",
      "source": "mobile",
      "correlationKey": "_id",
      "payload": {
        "$anon_distinct_id": "` +
        correlationValue +
        `",
        "distinct_id": "` +
        distinctId +
        `"
      },
      "correlationValue": "` +
        correlationValue +
        `"
    },
    {
      "timestamp": "` +
        timestamp +
        `",
      "uuid": "` +
        secondUUID +
        `",
      "event": "$set",
      "source": "mobile",
      "correlationKey": "_id",
      "correlationValue": "` +
        correlationValue +
        `",
      "payload": {
        "mkt_agree": true
      }
    }
  ]
}'
    `
      );
    default:
      return "";
  }
};
