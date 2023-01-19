import Progress from "components/Progress";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { correlateSlack } from "./CorrelationHelpers";

const Cor = () => {
  const { id } = useParams();
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function setLoadingAsync() {
      setLoading(true);
      try {
        await correlateSlack(id);
        setSuccess("Success");
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    setLoadingAsync();
  }, []);

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );
  if (loading) return <Progress />;
  return (
    <div>
      <p style={{ textAlign: "center" }}>{success}</p>
    </div>
  );
};

export default Cor;
