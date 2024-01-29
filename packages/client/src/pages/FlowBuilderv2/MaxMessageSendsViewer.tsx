import React, { FC } from "react";
import { JourneySettingsMaxMessageSends } from "reducers/flow-builder.reducer";

interface MaxMessageSendsViewerProps {
  maxMessageSendsSettings: JourneySettingsMaxMessageSends;
}

const MaxMessageSendsViewer: FC<MaxMessageSendsViewerProps> = ({
  maxMessageSendsSettings,
}) => {
  return (
    <div className="p-5 flex flex-col gap-2.5 bg-white">
      <div className="text-[16px] font-semibold leading-[24px]">
        Max message sends
      </div>
      <div>
        {maxMessageSendsSettings.maxSendRate && (
          <div>
            Limit max users who will receive message to:{" "}
            <b>{maxMessageSendsSettings.maxSendRate}</b> users
          </div>
        )}
        {maxMessageSendsSettings.maxUsersReceive && (
          <div>
            Limit the sending rate:{" "}
            <b>{maxMessageSendsSettings.maxUsersReceive}</b> messages per minute
          </div>
        )}
        {!maxMessageSendsSettings.maxSendRate &&
          !maxMessageSendsSettings.maxUsersReceive && <>No limitation</>}
      </div>
    </div>
  );
};

export default MaxMessageSendsViewer;
