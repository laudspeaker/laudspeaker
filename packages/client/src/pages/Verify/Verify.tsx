import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { useNavigate } from "react-router-dom";

const Verify = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await ApiService.patch({
          url: "/auth/verify-email/" + id,
          options: {},
        });

        toast.success("Email verified", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unexpected error.", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
      setLoading(false);
      navigate("/settings");
    })();
  }, []);

  if (loading) return <>Loading...</>;

  return <></>;
};

export default Verify;
