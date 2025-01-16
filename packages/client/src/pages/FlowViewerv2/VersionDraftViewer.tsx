import Table from "components/Tablev2";
import { FC, useState } from "react";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import { format } from "date-fns";
import useVersions from "hooks/useVersions";
import { useNavigate } from "react-router-dom";

enum SortProperty {
  STATUS = "status",
  LAST_UPDATE = "latestSave",
}

enum SortType {
  ASC = "asc",
  DESC = "desc",
}

interface SortOptions {
  sortBy: SortProperty;
  sortType: SortType;
}

const VersionDraftViewer = () => {
  const navigate = useNavigate();
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });

  const versions = useVersions();

  const handleGoToVersion = (id: string) => {
    const newVersion = versions.find((version) => version.uuid === id);
    const newVersionId = newVersion?.uuid;

    if (newVersion?.name === "Draft") {
      navigate(`/flow/${newVersionId}`, {
        state: { isFromVersions: true },
      });
    } else if (newVersionId) {
      navigate(`/flow/${newVersionId}/review-version`);
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
                  if (sortOptions.sortBy !== SortProperty.LAST_UPDATE) {
                    setSortOptions({
                      sortBy: SortProperty.LAST_UPDATE,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  if (sortOptions.sortType === SortType.ASC) {
                    setSortOptions({
                      sortBy: SortProperty.LAST_UPDATE,
                      sortType: SortType.DESC,
                    });

                    return;
                  }

                  setSortOptions({
                    sortBy: SortProperty.LAST_UPDATE,
                    sortType: SortType.ASC,
                  });
                }}
              >
                <div>Created</div>
                <div>
                  <img
                    src={
                      sortOptions.sortBy === SortProperty.LAST_UPDATE
                        ? sortOptions.sortType === SortType.ASC
                          ? sortAscChevronsImage
                          : sortDescChevronsImage
                        : sortNoneChevronsImage
                    }
                  />
                </div>
              </div>,
              <div className="px-5 py-[10px] select-none"></div>,
            ]}
            rowsData={versions}
            rows={versions.map((row) => [
              <button
                className="w-full text-left"
                onClick={() => handleGoToVersion(row.uuid)}
              >
                <div className="text-[#6366F1]">{row.name}</div>,
              </button>,
              <button
                className="w-full"
                onClick={() => handleGoToVersion(row.uuid)}
              >
                <div>
                  {format(new Date(row.created_at), "MM/dd/yyyy HH:mm")}
                </div>
              </button>,
            ])}
          />
        </div>
      </div>
    </>
  );
};

export default VersionDraftViewer;
