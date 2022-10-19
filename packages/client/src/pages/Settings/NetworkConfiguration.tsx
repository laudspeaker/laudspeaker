import { useTypedSelector } from "hooks/useTypeSelector";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NetworkCofiguration = () => {
  const navigate = useNavigate();
  const moveToEventsProvider = () => {
    navigate("/settings/events-provider");
  };

  const moveToSlackConfiguration = () => {
    navigate("/settings/slack-configuration");
  };

  const moveToEmailProvider = () => {
    navigate("/settings/email-provider");
  };

  const moveToPosthogConfiguration = () => {
    navigate("/settings/posthog-configuration");
  };

  const moveToCompletion = () => {
    navigate("/settings/completion");
  };

  const { settings } = useTypedSelector((state) => state.settings);

  useEffect(() => {
    const channels = settings.channel as string[];
    const nextChannel = channels[0];
    const eventsCompleted = settings.eventsCompleted;

    if (nextChannel === "Email") {
      moveToEmailProvider();
      return;
    }

    if (nextChannel === "Slack") {
      moveToSlackConfiguration();
      return;
    }

    if (!settings.eventsCompleted) {
      const events = settings.events as string[];
      if (!events?.length) {
        moveToEventsProvider();
        return;
      }
      const nextEvent = events[0];

      if (nextEvent === "Posthog") {
        moveToPosthogConfiguration();
        return;
      }
    }

    moveToCompletion();
  }, []);

  return <div>Loading...</div>;
};

export default NetworkCofiguration;
