import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SettingsIntegrationsBeta = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/integrations/db");
  }, []);

  return <></>;
};

export default SettingsIntegrationsBeta;
