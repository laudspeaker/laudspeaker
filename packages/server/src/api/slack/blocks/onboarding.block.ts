export function onboardingBlock(name: string) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hi ${name} :wave:`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Thanks for installing Laudspeaker! Laudspeaker helps you',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '• Design complex messaging flows\n • Send event-triggered messages\n • Keep track of which of your community members are engaged',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Please type your Laudspeaker account email in the text box and then click "Connect". We\'ll send you an email with a one time code/password to connect your Laudspeaker account to slack. Please make sure you are logged into Laudspeaker as well.',
      },
    },
    {
      type: 'input',
      block_id: 'email_id',
      element: {
        type: 'plain_text_input',
        action_id: 'email_input_action',
      },
      label: {
        type: 'plain_text',
        text: 'Email',
        emoji: true,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Connect',
            emoji: true,
          },
          value: 'click_me_123',
          action_id: 'Log_In',
        },
      ],
    },
  ];
}
