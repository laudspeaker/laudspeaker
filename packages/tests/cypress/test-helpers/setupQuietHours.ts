export default (startTime: string, endTime: string) => {
  cy.get("#quietHoursToggle").click();
  cy.get("#quietHoursStartTimeInput").type(startTime, {
    delay: 30,
  });
  cy.get("#quietHoursEndTimeInput").type(endTime, {
    delay: 30,
  });
  cy.get("#quietHoursFallbackAbort").click();
};
