/* eslint-disable no-undef */
import http from 'k6/http';
import { group, check, sleep } from 'k6';
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
  const audienceName = uuidv4();
  const segmentName = uuidv4();

  let workflowId;
  let audienceId;
  let segmentId;

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    response = http.options(`${__ENV.BACKEND_URL}/accounts`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization',
        'access-control-request-method': 'GET',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    sleep(1);

    response = http.post(
      `${__ENV.BACKEND_URL}/audiences/create`,
      `{"isDynamic":true,"name":"${audienceName}","description":"initial step","isPrimary":true,"workflowId":"${vars['id1']}","templates":[]}`,
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

    audienceId = JSON.parse(response.body).id;

    vars['id3'] = jsonpath.query(response.json(), '$.workflow.id')[0];

    response = http.options(`${__ENV.BACKEND_URL}/audiences/create`, null, {
      headers: {
        accept: '*/*',
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'POST',
        origin: `${__ENV.FRONTEND_URL}`,
        'sec-fetch-mode': 'cors',
      },
    });

    sleep(1);

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audienceId}`, {
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${vars['access_token']}`,
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
    });

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audienceId}`, {
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
      `${__ENV.BACKEND_URL}/audiences/${audienceId}`,
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

    sleep(1);

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

    sleep(1);

    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audienceId}`, {
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

    response = http.options(
      `${__ENV.BACKEND_URL}/audiences/${audienceId}`,
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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

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

    sleep(1);

    response = http.patch(
      `${__ENV.BACKEND_URL}/workflows`,
      `{"name":"${journeyName}","audiences":["${vars['id2']}"],"rules":[],"visualLayout":{"nodes":[{"id":"89c7342a-bcc3-4cea-993f-daa6df764404","position":{"x":139,"y":172},"type":"special","data":{"primary":true,"audienceId":"${vars['id2']}","triggers":[],"messages":[{"type":"email","templateId":17}],"dataTriggers":[],"flowId":"${vars['id3']}","isSelected":true,"nodeId":"89c7342a-bcc3-4cea-993f-daa6df764404","needsUpdate":true},"width":350,"height":78,"selected":true,"positionAbsolute":{"x":139,"y":172},"dragging":false}],"edges":[]},"isDynamic":true,"segmentId":"${segmentId}","id":"${vars['id3']}"}`,
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

    sleep(1);

    response = http.patch(
      `${__ENV.BACKEND_URL}/workflows`,
      `{"name":"${journeyName}","audiences":["${vars['id2']}"],"rules":[],"visualLayout":{"nodes":[{"id":"89c7342a-bcc3-4cea-993f-daa6df764404","position":{"x":139,"y":172},"type":"special","data":{"primary":true,"audienceId":"${vars['id2']}","triggers":[],"messages":[{"type":"email","templateId":17}],"dataTriggers":[],"flowId":"${vars['id3']}","isSelected":true,"nodeId":"89c7342a-bcc3-4cea-993f-daa6df764404","needsUpdate":true},"width":350,"height":78,"selected":true,"positionAbsolute":{"x":139,"y":172},"dragging":false}],"edges":[]},"isDynamic":true,"segmentId":"${segmentId}","id":"${vars['id3']}"}`,
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

    sleep(1);

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

    check(response, { 'Has status 200': (res) => res.status === 200 });

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
  });

  group(`page_2 - ${__ENV.FRONTEND_URL}/flow/${workflowId}`, function () {
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
    sleep(1);
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
    sleep(1);
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
    sleep(1);
    response = http.get(
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audienceId}&take=50&skip=0`,
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
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audienceId}&take=50&skip=0`,
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
    sleep(1);
    response = http.get(`${__ENV.BACKEND_URL}/audiences/${audienceId}`, {
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
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=sent&audienceId=${audienceId}&take=50&skip=0`,
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
      `${__ENV.BACKEND_URL}/customers/audienceStats?event=clicked&audienceId=${audienceId}&take=50&skip=0`,
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
      `${__ENV.BACKEND_URL}/audiences/${audienceId}`,
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
  });
  sleep(5);
}
