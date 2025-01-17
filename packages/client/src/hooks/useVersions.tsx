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

  // // Enable when endpoint works
  // useEffect(() => {
  //   loadData();
  // }, []);

  return [
    {
      uuid: "cc6b217c-95ec-4b14-afdd-612f80df60f5",
      number: 1,
      created_at: "2025-01-13T19:13:14.754Z",
      journey_uuid: "cc6b217c-95ec-4b14-afdd-612f80df60f5",
      name: "Draft",
    },
    {
      uuid: "966fbcfd-fcdc-4e79-98c3-acf058833cbd",
      number: 5,
      created_at: "2025-01-10T12:07:06.663Z",
      journey_uuid: "966fbcfd-fcdc-4e79-98c3-acf058833cbd",
      name: "Version 1",
    },
    {
      uuid: "af649c38-32d5-4694-81b6-3412b2d96b24",
      number: 3,
      created_at: "2025-01-10T19:05:11.013Z",
      journey_uuid: "af649c38-32d5-4694-81b6-3412b2d96b24",
      name: "Version 2",
    },
  ];
};

export default useVersions;
