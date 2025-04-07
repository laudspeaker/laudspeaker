import React, { useState, useEffect } from "react";
import FlowEditor from "pages/FlowBuilderv2/FlowEditor";
import { useParams } from "react-router-dom";
import Progress from "components/Progress";
import { useAppSelector } from "store/hooks";
import useVersions from "hooks/useVersions";
import { useNavigate } from "react-router-dom";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import RestoreVersionModal from "pages/FlowBuilderv2/Modals/RestoreVersionModal";
import VersionsSelect from "components/VersionsSelect";
import { useLocation } from "react-router-dom";
import useLoadVersion from "pages/FlowBuilderv2/hooks/useLoadVersion";
import ApiService from "services/api.service";

const VersionViewer = () => {
  const { journeyId, versionId } = useParams();
  const { versions } = useVersions();
  const navigate = useNavigate();
  const location = useLocation();
  const { flowName, isStarting } = useAppSelector((state) => state.flowBuilder);

  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFromVersions = location.state?.isFromVersions;

  useEffect(() => {
    const currentVersion = versions.find(
      (version) => `${version.uuid}` === versionId
    );

    if (currentVersion && !selectedVersion.length) {
      setSelectedVersion(currentVersion?.name);
    }
  }, [journeyId, versionId]);

  const { loadVersion } = useLoadVersion({ versionId, setIsLoading });

  const handleExit = () => {
    if (isFromVersions) {
      navigate(`/flow/${journeyId}/view`, {
        state: {
          isFromVersions: true,
        },
      });
    } else {
      navigate("/flow");
    }
  };

  const onRestore = async () => {
    const { data } = await ApiService.post({
      url: `/journeys/${journeyId}/check_out/${versionId}`,
    });
    // TODO: pass a param of version to restore
    if (data.uuid) {
      navigate(`/flow/${journeyId}`, {
        state: { isFromVersions: true, versionId: data.uuid },
      });
    }
  };

  useEffect(() => {
    loadVersion();
  }, [journeyId, versionId]);

  return (
    <>
      {isLoading && (
        <div className="w-full h-full absolute top-0 left-0 bg-[#111827] bg-opacity-20 z-[99]">
          <Progress />
        </div>
      )}
      <div className="w-full flex justify-between items-center h-[60px] border-y-[1px] border-[#E5E7EB] bg-white font-segoe font-normal text-[16px] text-[#111827] leading-[24px]">
        <div className="flex items-center ml-[16px]">
          <div className="text-ellipsis max-w-[260px] overflow-hidden mr-[16px] font-inter font-normal text-[14px] leading-[22px]">
            {flowName}
          </div>

          <RestoreVersionModal
            isOpen={isRestoreModalOpen}
            onClose={() => setIsRestoreModalOpen(false)}
            versionName={selectedVersion}
            onConfirm={onRestore}
          />
        </div>

        <VersionsSelect />

        <div className="flex">
          <Button
            type={ButtonType.SECONDARY_GREY}
            onClick={handleExit}
            className="mr-[10px]"
            id="exit-button"
          >
            Exit
          </Button>

          <Button
            type={ButtonType.PRIMARY}
            onClick={() => {
              setIsRestoreModalOpen(true);
            }}
            className="mr-[20px]"
            id="start-journey-button"
            disabled={isStarting}
          >
            Restore
          </Button>
        </div>
      </div>

      <div className="relative w-full h-full text-[#111827] font-inter font-normal text-[14px] leading-[22px]">
        <FlowEditor isViewMode className="bg-[#F9FAFB]" />
      </div>
    </>
  );
};

export default VersionViewer;
