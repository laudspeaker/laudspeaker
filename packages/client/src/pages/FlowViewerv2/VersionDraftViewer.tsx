import Table from "components/Tablev2";
import { FC, useState } from "react";
import sortAscChevronsImage from "./svg/sort-asc-chevrons.svg";
import sortDescChevronsImage from "./svg/sort-desc-chevrons.svg";
import sortNoneChevronsImage from "./svg/sort-none-chevrons.svg";
import { format } from "date-fns";
import useVersions from "hooks/useVersions";

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

interface VersionDraftViewerInterface {
  id: any;
}

const VersionDraftViewer: FC<VersionDraftViewerInterface> = ({ id }) => {
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: SortProperty.LAST_UPDATE,
    sortType: SortType.DESC,
  });

  const mockVersions = useVersions();

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
            rowsData={mockVersions}
            rows={mockVersions.map((row) => [
              <div className="text-[#6366F1]">{row.name}</div>,
              <div>{format(new Date(row.created_at), "MM/dd/yyyy HH:mm")}</div>,
            ])}
          />
        </div>
      </div>
    </>
  );
};

export default VersionDraftViewer;
