import Account from "./Account";

export default interface Template {
  id: string;
  name: string;
  owner: Account;
  text: string;
  style: string;
  subject: string;
  slackMessage: string;
  type: "email" | "slack" | "sms";
  smsText: string;
}
