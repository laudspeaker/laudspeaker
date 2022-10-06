import { useTypedSelector } from "hooks/useTypeSelector";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NetworkCofiguration = () => {
  const navigate = useNavigate();
  const moveToEventProvider = () => {
    navigate("/settings/event-provider");
  };

  const moveToSlackConfiguration = () => {
    navigate("/settings/slack-configuration");
  };

  const moveToEvents = () => {
    navigate("/settings/events");
  };

  const moveToPosthog = () => {
    navigate("/settings/phconfiguration");
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
      moveToEventProvider();
      return;
    }

    if (nextChannel === "Slack") {
      moveToSlackConfiguration();
      return;
    }

    if (!settings.eventsCompleted) {
      const events = settings.events as string[];
      if (!events?.length) {
        moveToEvents();
        return;
      }
      const nextEvent = events[0];

      if (nextEvent === "Posthog") {
        moveToPosthog();
        return;
      }
    }

    moveToCompletion();
  }, []);

  return <div>Loading...</div>;
};

export default NetworkCofiguration;
