import http from "k6/http";
export function createAccount(email, httpxWrapper) {
  let password = "Password1$";
  let registerResponse = httpxWrapper.postOrFail(
    "/api/auth/register",
    `{"firstName":"Test","lastName":"Test","email":"${email}","password":"${password}"}`
  );

  let authorization = `Bearer ${registerResponse.json("access_token")}`;
  httpxWrapper.session.addHeader("Authorization", authorization);
  let organizatonResponse = httpxWrapper.postOrFail(
    "/api/organizations",
    '{"name":"Test","timezoneUTCOffset":"UTC-07:00"}'
  );
  return { email, password, authorization };
}
