const { TESTS_SMS_TO } = Cypress.env();

export default {
  email: "john.smith@gmail.com",
  password: "john.smith007",
  MessageHitUser: {
    email: "testmail@gmail.com",
    password: "00000000",
    userAPIkey: "dowkp5HD51tdEL4U09kFW2MKj3hCyT664Ol40000",
    journeyName: "Test Journey For Hitting Events",
    slackTemplate: {
      name: "TestTemplateForSlackSending",
      message:
        "Test slack message by cypress. Unknown tag: {{ randomText }}, known tag: {{ slackEmail }}",
      eventName: "testEventName1",
      slackUid: "U04323JCL5A",
    },
    emailTemplate: {
      name: "TestTemplateForEmailSending",
      subject:
        "Test email message by cypress. Unknown tag: {{ randomText }}, known tag: {{ slackEmail }}",
      eventName: "testEventName2",
      correlationValue: "testmail@gmail.com",
    },
    smsTemplate: {
      name: "TestTemplateForSMSSending",
      message:
        "Test SMS message by cypress. Unknown tag: {{ randomText }}, known tag: {{ slackEmail }}",
      eventName: "testEventName3",
      phone: TESTS_SMS_TO || "+111111111111",
    },
  },
  segments: {
    manual: { name: "Manual 1", description: "Manual segment" },
    automatic: { name: "Automatic 1", description: "Automatic segment" },
  },
};
