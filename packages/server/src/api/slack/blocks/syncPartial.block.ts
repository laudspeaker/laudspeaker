export function syncPartial() {
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Lets Sync!',
    },
    submit: {
      type: 'plain_text',
      text: 'Submit',
    },
    blocks: [
      {
        type: 'section',
        block_id: 'cs',
        text: {
          type: 'mrkdwn',
          text: 'Pick conversations from the list',
        },
        accessory: {
          action_id: 'ab',
          type: 'multi_conversations_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select conversations',
          },
        },
      },
    ],
  };
}
