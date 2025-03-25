import { EdgeData } from "pages/FlowBuilderv2/Edges/EdgeData";
import { NodeData } from "pages/FlowBuilderv2/Nodes/NodeData";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Edge, Node } from "reactflow";
import ApiService from "services/api.service";
interface IVersion {
  uuid: string;
  created_at: string;
  updated_at: string;
  id: string;
  journey_id: string;
  layout: { nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] };
  number: 1;
  state: string;
  workspace_id: string;
}

const useVersions = () => {
  const [versions, setVersions] = useState<IVersion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { id, journeyId } = useParams();

  const loadData = async () => {
    if (!(id || journeyId)) return;

    try {
      const { data } = await ApiService.get<IVersion[]>({
        url: `/journeys/${id || journeyId}/versions`,
      });
      console.log(data, "data");
      const enhancedData = data.map((version) => {
        return {
          ...version,
          name:
            version.state === "Draft" ? "Draft" : `Version ${version.number}`,
        };
      });
      setVersions(enhancedData);
      setIsLoaded(true);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return versions || [];
  // return [
  //   {
  //     uuid: "cc6b217c-95ec-4b14-afdd-612f80df60f5",
  //     number: 1,
  //     created_at: "2025-01-13T19:13:14.754Z",
  //     journey_uuid: "cc6b217c-95ec-4b14-afdd-612f80df60f5",
  //     name: "Draft",
  //   },
  //   {
  //     uuid: "966fbcfd-fcdc-4e79-98c3-acf058833cbd",
  //     number: 5,
  //     created_at: "2025-01-10T12:07:06.663Z",
  //     journey_uuid: "966fbcfd-fcdc-4e79-98c3-acf058833cbd",
  //     name: "Version 1",
  //   },
  //   {
  //     uuid: "af649c38-32d5-4694-81b6-3412b2d96b24",
  //     number: 3,
  //     created_at: "2025-01-10T19:05:11.013Z",
  //     journey_uuid: "af649c38-32d5-4694-81b6-3412b2d96b24",
  //     name: "Version 2",
  //   },
  // ];
};

export default useVersions;
