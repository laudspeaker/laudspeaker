import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";

const useVersions = () => {
  const [versions, setVersions] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const { data } = await ApiService.get<any>({
        url: `/flow/a56090fd-cec7-4b2b-9e7c-b0d0bca5a738/versions`,
      });
      console.log(data, "data");
      setVersions(data);
      setIsLoaded(true);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  //Enable when endpoint works
  // useEffect(() => {
  //   loadData();
  // }, []);

  return [
    {
      uuid: "8fb50ca6-8ccb-459f-babd-73e8b3b7ce9b",
      number: 1,
      created_at: "2025-01-13T19:13:14.754Z",
      journey_uuid: "8fb50ca6-8ccb-459f-babd-73e8b3b7ce9b",
      name: "Draft",
    },
    {
      uuid: "a56090fd-cec7-4b2b-9e7c-b0d0bca5a738",
      number: 5,
      created_at: "2025-01-10T12:07:06.663Z",
      journey_uuid: "a56090fd-cec7-4b2b-9e7c-b0d0bca5a738",
      name: "Version 1",
    },
    {
      uuid: "6d5e9d4a-ea21-4fa8-8f68-78675d562ac1",
      number: 3,
      created_at: "2025-01-10T19:05:11.013Z",
      journey_uuid: "6d5e9d4a-ea21-4fa8-8f68-78675d562ac1",
      name: "Version 2",
    },
  ];
};

export default useVersions;
