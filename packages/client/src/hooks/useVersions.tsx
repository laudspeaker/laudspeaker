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
  name: string;
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
      setVersions(enhancedData || []);
      setIsLoaded(true);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { versions, refetchVersions: loadData };
};

export default useVersions;
