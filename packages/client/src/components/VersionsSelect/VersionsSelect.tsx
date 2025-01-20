import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import useVersions from "hooks/useVersions";
import { TickIcon } from "pages/FlowBuilderv2/Icons";
import { useNavigate } from "react-router-dom";
import Select from "components/Elements/Selectv2";

const VersionsSelect = () => {
  const versions = useVersions();
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  useEffect(() => {
    const currentVersion = versions.find((version) => `${version.uuid}` === id);

    if (currentVersion && !selectedVersion.length) {
      setSelectedVersion(currentVersion?.name);
    }
  }, [id]);

  const versionsOptions = versions.map((version) => {
    return {
      key: version.name,
      title: version.name,
      additionalData: format(new Date(version.created_at), "dd MMM, hh:mm a"),
    };
  });

  const renderCustomOption = (
    props: any,
    additionalData: string | undefined
  ) => {
    const title = props["data-option"];

    return (
      <div
        {...props}
        className="flex flex-row items-center min-w-[220px] justify-between overflow-hidden text-ellipsis whitespace-nowrap px-[20px] py-[8px] hover:bg-[#EEF2FF] select-none cursor-pointer"
      >
        <div>
          {title}
          {!!additionalData && (
            <div className="text-[12px] text-[#4B5563]">{additionalData}</div>
          )}
        </div>
        {selectedVersion === title && <TickIcon />}
      </div>
    );
  };

  return (
    <div className="justify-center">
      <Select
        className="border-transparent"
        options={versionsOptions}
        value={selectedVersion}
        onChange={(value) => {
          const newVersion = versions.find((version) => version.name === value);
          const newVersionId = newVersion?.uuid;
          setSelectedVersion(value);

          if (newVersion?.name === "Draft") {
            navigate(`/flow/${newVersionId}`, {
              state: { isFromVersions: true },
            });
          } else if (newVersionId) {
            navigate(`/flow/${newVersionId}/review-version`);
          }
        }}
        renderCustomOption={renderCustomOption}
        panelClassName="-translate-x-[30%]"
      />
    </div>
  );
};

export default VersionsSelect;
