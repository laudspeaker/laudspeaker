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

  const moveToCompletion = () => {
    navigate("/settings/completion");
  };

  const { settings } = useTypedSelector((state) => state.settings);

  useEffect(() => {
    const channels = settings.channel as string[];
    const nextChannel = channels[0];

    if (nextChannel === "Email") {
      moveToEventProvider();
      return;
    }

    if (nextChannel === "Slack") {
      moveToSlackConfiguration();
      return;
    }

    moveToCompletion();
  }, []);

  return <div>Loading...</div>;
};

export default NetworkCofiguration;
