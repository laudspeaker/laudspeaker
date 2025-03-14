import Table from "components/Tablev2";
import { FC, useEffect, useState } from "react";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import { format } from "date-fns";
import useVersions from "hooks/useVersions";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

const VersionDraftViewer = () => {
  const navigate = useNavigate();
  const [sortType, setSortType] = useState<SortType>(SortType.DESC);

  const versions = useVersions();
  const [sortedVersions, setSortedVersions] = useState(versions);
  const { id: journeyId } = useParams();

  const sortVersions = () => {
    const sortedVersionsByTime = [...versions].sort((a, b) => {
      if (sortType === SortType.ASC) {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    });
    setSortedVersions(sortedVersionsByTime);
  };

  useEffect(() => {
    sortVersions();
  }, [versions, sortType]);

  const handleGoToVersion = async (id: string) => {
    const newVersion = versions.find((version) => version.uuid === id);
    const newVersionId = newVersion?.uuid;

    if (newVersion?.name === "Draft" && newVersionId) {
      navigate(`/flow/${journeyId}`, {
        state: { isFromVersions: true, versionId: newVersionId },
      });
    } else if (newVersionId) {
      navigate(`/flow/${journeyId}/${newVersionId}/review-version`, {
        state: { isFromVersions: true },
      });
    }
  };

  return (
    <>
      <div className="p-5 w-full">
        <div className="p-5 bg-white rounded-lg">
          <Table
            className="w-full"
            isLoading={false}
            headClassName="bg-[#F3F4F6]"
            headings={[
              <div className="px-5 py-[10px] select-none w-full">Name</div>,
              <div
                className="px-5 py-[10px] select-none flex gap-[2px] w-full items-center cursor-pointer"
                onClick={() => {
                  if (sortType === SortType.ASC) {
                    setSortType(SortType.DESC);
                    return;
                  }
                  setSortType(SortType.ASC);
                }}
              >
                <div>Created</div>
                <div>
                  <img
                    src={
                      sortType === SortType.ASC
                        ? sortAscChevronsImage
                        : sortDescChevronsImage
                    }
                  />
                </div>
              </div>,
            ]}
            rowsData={sortedVersions}
            rows={sortedVersions.map((row) => [
              <div className="text-[#6366F1]">{row.name}</div>,
              <div className="w-full">
                {format(new Date(row.created_at), "MM/dd/yyyy HH:mm")}
              </div>,
            ])}
            rowClassName="text-left align-middle w-full"
            onRowClick={(i) => handleGoToVersion(sortedVersions[i]?.uuid)}
          />
        </div>
      </div>
    </>
  );
};

export default VersionDraftViewer;
