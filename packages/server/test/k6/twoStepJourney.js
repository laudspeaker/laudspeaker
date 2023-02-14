/* eslint-disable no-undef */

import { sleep, group, check } from 'k6';
import http from 'k6/http';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js';

export const options = {
  stages: [
    { target: 1, duration: '1m' },
    { target: 10, duration: '5m' },
    { target: 5, duration: '3m' },
    { target: 1, duration: '1m' },
  ],
};

export default function main() {
  let response;

  const vars = {};

  const journeyName = uuidv4();
  const audience1Name = uuidv4();
  const audience2Name = uuidv4();
  const segmentName = uuidv4();

  let workflowId;
  let audience1Id;
  let audience2Id;
  let segmentId;
  let apiKey;

  group(`page_1 - ${__ENV.FRONTEND_URL}/login`, function () {
    response = http.post(
      `${__ENV.BACKEND_URL}/auth/login`,
      '{"email":"testmail@gmail.com","password":"00000000"}',
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    apiKey = JSON.parse(response.body).apiKey;

    vars['access_token'] = jsonpath.query(response.json(), '$.access_token')[0];

    response = http.options(`${__ENV.BACKEND_URL}/auth/login`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'content-type',
        'access-control-request-method': 'POST',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/auth`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/auth`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/accounts`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/accounts`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/accounts`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/accounts`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(
      `${__ENV.BACKEND_URL}/workflows?take=20&skip=0&orderBy=&orderType=`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/workflows?take=20&skip=0&orderBy=&orderType=`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.post(
      `${__ENV.BACKEND_URL}/workflows`,
      `{"name":"${journeyName}"}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    workflowId = JSON.parse(response.body).id;

    response = http.options(`${__ENV.BACKEND_URL}/workflows`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'POST',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=false`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    vars['id1'] = jsonpath.query(response.json(), '$.id')[0];

    response = http.options(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=false`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/accounts`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/accounts`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/accounts`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/accounts`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=false`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.post(
      `${__ENV.BACKEND_URL}/audiences/create`,
      `{"isDynamic":true,"name":"${audience1Name}","description":"initial step","isPrimary":true,"workflowId":"${vars['id1']}","templates":[]}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    audience1Id = JSON.parse(response.body).id;

    response = http.options(`${__ENV.BACKEND_URL}/audiences/create`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'POST',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience1Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience1Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience1Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience1Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.post(
      `${__ENV.BACKEND_URL}/audiences/create`,
      `{"isDynamic":true,"name":"${audience2Name}","description":"","isPrimary":false,"workflowId":"${vars['id1']}","templates":[]}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    audience2Id = JSON.parse(response.body).id;

    vars['id4'] = jsonpath.query(response.json(), '$.workflow.id')[0];

    response = http.options(`${__ENV.BACKEND_URL}/audiences/create`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'POST',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience2Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience2Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience2Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience2Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience1Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    vars['id2'] = jsonpath.query(response.json(), '$.id')[0];

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience2Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    vars['id3'] = jsonpath.query(response.json(), '$.id')[0];

    response = http.get(`${__ENV.BACKEND_URL}/events/possible-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience1Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/events/possible-posthog-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-posthog-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/events/attributes/`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/and`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/false`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/and`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/false`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=custom`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=custom`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/a?provider=custom`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/a?provider=custom`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/isEqual`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/isEqual`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=a`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=a`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.BACKEND_URL}/segments?searchText=`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/segments?searchText=`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/segments?searchText=`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.put(
      `${__ENV.BACKEND_URL}/segments`,
      `{"name":"${segmentName}","inclusionCriteria":{"conditionalType":"and","conditions":[]},"resources":{"conditions":{"id":"conditions","type":"select","label":"filter on","options":[{"label":"select","id":"","isPlaceholder":true},{"label":"Attributes","id":"attributes"}]}}}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    segmentId = JSON.parse(response.body).id;

    response = http.options(`${__ENV.BACKEND_URL}/segments`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'PUT',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/segments?searchText=`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/segments?searchText=`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/templates`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(`${__ENV.BACKEND_URL}/templates`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience1Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience2Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience1Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience2Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.patch(
      `${__ENV.BACKEND_URL}/workflows`,
      `{"name":"${journeyName}","audiences":["${vars['id2']}","${vars['id3']}"],"rules":[{"type":"eventBased","source":"${vars['id2']}","dest":["${vars['id3']}"],"properties":{"conditions":[{"key":"A","value":"A","comparisonType":"isEqual","type":"String","relationWithNext":"and","isArray":false}]},"providerType":"custom"}],"visualLayout":{"nodes":[{"id":"1f865737-113f-4683-949c-f0c3379e624d","position":{"x":67,"y":103},"type":"special","data":{"primary":true,"audienceId":"${vars['id2']}","triggers":[{"id":"5f4cccec-92c7-4313-bef1-79809b23ef60","title":"Event Based","type":"eventBased","properties":{"conditions":[{"key":"A","value":"A","comparisonType":"isEqual","type":"String","relationWithNext":"and","isArray":false}]},"providerType":"custom"}],"messages":[],"dataTriggers":[],"flowId":"${vars['id4']}","isSelected":false,"nodeId":"1f865737-113f-4683-949c-f0c3379e624d","needsUpdate":true,"isConnecting":false,"isNearToCursor":false},"width":350,"height":78,"selected":false,"positionAbsolute":{"x":67,"y":103},"dragging":false},{"id":"9ba91837-4f89-4be6-9784-1ba264ef3a72","position":{"x":90,"y":310},"type":"special","data":{"primary":false,"audienceId":"${vars['id3']}","triggers":[],"messages":[{"type":"email","templateId":197}],"dataTriggers":[],"flowId":"${vars['id4']}","isSelected":true,"nodeId":"9ba91837-4f89-4be6-9784-1ba264ef3a72","needsUpdate":true,"isConnecting":false,"isNearToCursor":false},"width":350,"height":57,"selected":true,"positionAbsolute":{"x":90,"y":310},"dragging":false}],"edges":[{"source":"1f865737-113f-4683-949c-f0c3379e624d","sourceHandle":"5f4cccec-92c7-4313-bef1-79809b23ef60","target":"9ba91837-4f89-4be6-9784-1ba264ef3a72","targetHandle":null,"id":"854a73ba-dc1e-4d38-9f41-ced7d45f90c7","markerEnd":{"type":"arrow","strokeWidth":2,"height":20,"width":20},"type":"custom"}]},"isDynamic":true,"segmentId":"${segmentId}","id":"${vars['id4']}"}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );

    response = http.options(`${__ENV.BACKEND_URL}/workflows`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'PATCH',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    response = http.patch(
      `${__ENV.BACKEND_URL}/workflows`,
      `{"name":"${journeyName}","audiences":["${vars['id2']}","${vars['id3']}"],"rules":[{"type":"eventBased","source":"${vars['id2']}","dest":["${vars['id3']}"],"properties":{"conditions":[{"key":"A","value":"A","comparisonType":"isEqual","type":"String","relationWithNext":"and","isArray":false}]},"providerType":"custom"}],"visualLayout":{"nodes":[{"id":"1f865737-113f-4683-949c-f0c3379e624d","position":{"x":67,"y":103},"type":"special","data":{"primary":true,"audienceId":"${vars['id2']}","triggers":[{"id":"5f4cccec-92c7-4313-bef1-79809b23ef60","title":"Event Based","type":"eventBased","properties":{"conditions":[{"key":"A","value":"A","comparisonType":"isEqual","type":"String","relationWithNext":"and","isArray":false}]},"providerType":"custom"}],"messages":[],"dataTriggers":[],"flowId":"${vars['id4']}","isSelected":false,"nodeId":"1f865737-113f-4683-949c-f0c3379e624d","needsUpdate":true,"isConnecting":false,"isNearToCursor":false},"width":350,"height":78,"selected":false,"positionAbsolute":{"x":67,"y":103},"dragging":false},{"id":"9ba91837-4f89-4be6-9784-1ba264ef3a72","position":{"x":90,"y":310},"type":"special","data":{"primary":false,"audienceId":"${vars['id3']}","triggers":[],"messages":[{"type":"email","templateId":197}],"dataTriggers":[],"flowId":"${vars['id4']}","isSelected":true,"nodeId":"9ba91837-4f89-4be6-9784-1ba264ef3a72","needsUpdate":true,"isConnecting":false,"isNearToCursor":false},"width":350,"height":57,"selected":true,"positionAbsolute":{"x":90,"y":310},"dragging":false}],"edges":[{"source":"1f865737-113f-4683-949c-f0c3379e624d","sourceHandle":"5f4cccec-92c7-4313-bef1-79809b23ef60","target":"9ba91837-4f89-4be6-9784-1ba264ef3a72","targetHandle":null,"id":"854a73ba-dc1e-4d38-9f41-ced7d45f90c7","markerEnd":{"type":"arrow","strokeWidth":2,"height":20,"width":20},"type":"custom"}]},"isDynamic":true,"segmentId":"${segmentId}","id":"${vars['id4']}"}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'content-type': 'application/json',
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
  });

  group(`page_2 - ${__ENV.FRONTEND_URL}/flow/${workflowId}`, function () {
    response = http.get(`${__ENV.BACKEND_URL}/workflows/start/${workflowId}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    check(response, { 'Start has status 200': (res) => res.status === 200 });

    response = http.options(
      `${__ENV.BACKEND_URL}/workflows/start/${workflowId}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.get(`${__ENV.FRONTEND_URL}/flow/${workflowId}`, {
      headers: {
        'upgrade-insecure-requests': '1',
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/auth`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(`${__ENV.BACKEND_URL}/auth`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });
    response = http.get(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=false`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=false`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=true`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/workflows/${workflowId}?needsStats=true`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audience1Id}&take=50&skip=0`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audience1Id}&take=50&skip=0`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audience1Id}&take=50&skip=0`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience1Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audience2Id}&take=50&skip=0`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audience2Id}&take=50&skip=0`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audience1Id}&take=50&skip=0`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience1Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audience2Id}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audience2Id}&take=50&skip=0`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audience2Id}&take=50&skip=0`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audience2Id}`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/isEqual`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/possible-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/isEqual`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/A`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/String`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/A`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/false`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/isEqual`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(`${__ENV.BACKEND_URL}/events/attributes/A`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/String`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(`${__ENV.BACKEND_URL}/events/attributes/A`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/false`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/and`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/and`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=A`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/possible-posthog-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=A`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-posthog-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/isEqual`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/possible-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-comparison/String`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/isEqual`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/?provider=`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/A`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/String`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/A`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(`${__ENV.BACKEND_URL}/events/attributes/A`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/false`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/String`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(`${__ENV.BACKEND_URL}/events/attributes/A`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/isEqual`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/false`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/attributes/and`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/attributes/and`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=A`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${vars['access_token']}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    response = http.get(`${__ENV.BACKEND_URL}/events/possible-posthog-types`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-attributes/A?provider=custom`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-values/A?search=A`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );
    response = http.options(
      `${__ENV.BACKEND_URL}/events/possible-posthog-types`,
      null,
      {
        headers: {
          accept: '*/*',
          'access-control-request-headers': 'authorization',
          'access-control-request-method': 'GET',
          origin: `${__ENV.FRONTEND_URL}`,
          'sec-fetch-mode': 'cors',
        },
      }
    );

    response = http.post(
      `${__ENV.BACKEND_URL}/events`,
      JSON.stringify({
        correlationKey: 'email',
        correlationValue: 'testmail@gmail.com',
        event: {
          A: 'A',
        },
      }),
      {
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/plain, */*',
          authorization: `Api-Key ${apiKey}`,
          'sec-ch-ua':
            '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        },
      }
    );
    check(response, { 'Hit has status 201': (res) => res.status === 201 });
  });

  // Automatically added sleep
  sleep(5);
}
