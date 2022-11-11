import Header from "components/Header";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";

const Verify = () => {
  const { id } = useParams();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await ApiService.patch({
        url: "/auth/verify-email/" + id,
        options: {},
      });
      if (status === 200) setVerified(true);
      setLoading(false);
    })();
  }, []);

  if (loading) return <>Loading...</>;

  if (!verified) return <>Failed to verify...</>;

  return (
    <>
      <Header />
      <div>You successfully verified your email!</div>
    </>
  );
};

export default Verify;
