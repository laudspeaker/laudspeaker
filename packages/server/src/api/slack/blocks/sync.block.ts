export function syncBlock(name: string) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hi ${name} :wave: we're back! \n\n Now we are going to Sync your community so you can:`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '• Import all or a subset of your community members  \n • Automatically message any member you want \n • Track engagement in your community \n ',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Sync All Contacts',
            emoji: true,
          },
          value: 'click_me_123',
          action_id: 'Sync_Slack_Contacts',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Sync Channels',
          },
          value: 'click',
          action_id: 'Sync_Partial',
        },
      ],
    },
  ];
}
