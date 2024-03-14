function createStep(type) {
  return httpxWrapper.postOrFail(
    "/api/steps",
    `{"type":"${type}","journeyID":"${JOURNEY_ID}"}`
  );
}
