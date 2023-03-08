import { TableTemplate } from "components/TableTemplate";
import { ApiConfig } from "../../constants";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import Progress from "components/Progress";
import { TableDataItem } from "components/TableTemplate/TableTemplate";
import { getCustomerKeys } from "pages/Segment/SegmentHelpers";
import { useDebounce } from "react-use";
import AC from "react-autocomplete";
import { Input } from "components/Elements";

interface SegmentCustomerPickerProps {
  segmentId: string;
}

interface ICustomerKey {
  key: string;
  type: "String" | "Number" | "Boolean" | "Email";
  isArray: boolean;
}

const SegmentCustomerPicker: FC<SegmentCustomerPickerProps> = ({
  segmentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Record<string, any>[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [possibleKeys, setPossibleKeys] = useState<ICustomerKey[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const setLoadingAsync = async () => {
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `${ApiConfig.getAllPeople}?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&checkInSegment=${segmentId}&searchKey=${searchKey}&searchValue=${searchValue}`,
      });
      const { data: fetchedPeople, totalPages } = data;
      setPagesCount(totalPages);
      setPeople(fetchedPeople);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoadingAsync();
  }, [itemsPerPage, currentPage]);

  useDebounce(
    () => {
      (async () => {
        const data = await getCustomerKeys(searchKey, null, false);
        setPossibleKeys(data);
        if (searchKey === "") {
          setSearchValue("");
          setLoadingAsync();
        }
      })();
    },
    800,
    [searchKey]
  );

  useDebounce(
    () => {
      if (!searchKey && !searchValue) return;
      setLoadingAsync();
    },
    800,
    [searchValue]
  );

  const handlePersonAdd = async (row: TableDataItem) => {
    await ApiService.post({
      url: `/segments/${segmentId}/customers`,
      options: { customerId: row.id },
    });
    const person = people.find((p) => p.id === row.id);
    if (person) person.isInsideSegment = true;

    setPeople([...people]);
  };

  const handlePersonDelete = async (row: TableDataItem) => {
    await ApiService.delete({
      url: `/segments/${segmentId}/customers/${row.id}`,
    });

    const person = people.find((p) => p.id === row.id);
    if (person) person.isInsideSegment = false;

    setPeople([...people]);
  };

  if (loading)
    return (
      <div className="min-h-[70vh] flex justify-center items-center max-h-[70vh]">
        <Progress />
      </div>
    );

  return (
    <div>
      <div className="relative px-[32px] flex w-full max-w-full gap-[10px]">
        <AC
          getItemValue={(item) => JSON.stringify(item)}
          items={possibleKeys}
          autoHighlight={false}
          wrapperStyle={{
            width: "100%",
          }}
          renderInput={(props) => (
            <Input
              name={props.name || ""}
              value={props.value}
              onChange={props.onChange}
              inputRef={props.ref}
              aria-expanded={props["aria-expanded"]}
              id="keyInput"
              label="Customer key (String only)"
              className="!w-full"
              {...props}
            />
          )}
          renderItem={(item, isHighlighted) => (
            <div
              className={`${
                isHighlighted ? "bg-cyan-100" : ""
              } p-[2px] rounded-[6px] relative max-w-full break-all`}
            >
              {item.key} ({item.type})
            </div>
          )}
          renderMenu={(items) => {
            if (!items.length) return <></>;

            return (
              <div className="max-h-[200px] overflow-y-scroll shadow-md  border-[1px] bg-white border-cyan-500 absolute top-[calc(100%+4px)] w-full rounded-[6px] z-[9999999999]">
                {items}
              </div>
            );
          }}
          value={searchKey}
          onChange={(e) => {
            setSearchKey(e.target.value);
          }}
          onSelect={(e) => {
            const val = JSON.parse(e);
            setSearchKey(val.key);
          }}
        />
        <Input
          name={"search-value"}
          value={searchValue}
          onChange={(el) => setSearchValue(el.target.value || "")}
          label="Value"
          disabled={!searchKey}
          wrapperClasses={!searchKey ? "opacity-[0.5]" : ""}
        />
      </div>
      <TableTemplate
        className="max-h-[70vh] w-full"
        data={people}
        pagesCount={pagesCount}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        showDeletedToggle={false}
        onPersonAdd={handlePersonAdd}
        onPersonDelete={handlePersonDelete}
      />
    </div>
  );
};

export default SegmentCustomerPicker;
