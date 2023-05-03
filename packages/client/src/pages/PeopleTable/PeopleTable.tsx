import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameTemplate from "./NamePerson";
import Modal from "components/Elements/Modal";
import { useEffect, useState } from "react";
import Progress from "components/Progress";
import { Input } from "components/Elements";
import { useDebounce } from "react-use";
import { getCustomerKeys } from "pages/Segment/SegmentHelpers";
import { ICustomerKey } from "pages/SegmentViewer/SegmentCustomerPicker";
import AutoComplete from "components/Autocomplete";

const PeopleTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [people, setPeople] = useState<Record<string, any>[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [possibleKeys, setPossibleKeys] = useState<ICustomerKey[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [showFreezed, setShowFreezed] = useState(false);

  const setLoadingAsync = async () => {
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `${ApiConfig.getAllPeople}?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&searchKey=${searchKey}&searchValue=${searchValue}&showFreezed=${showFreezed}`,
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
    setIsFirstRender(false);
  }, [itemsPerPage, currentPage, showFreezed]);

  useDebounce(
    () => {
      if (isFirstRender) return;
      setLoadingAsync();
    },
    800,
    [searchValue]
  );

  useDebounce(
    () => {
      (async () => {
        const data = await getCustomerKeys(searchKey, null, false);
        setPossibleKeys(
          data.filter((el: any) =>
            ["Email", "Number", "String"].includes(el.type)
          )
        );
        console.log(searchKey);
        if (searchKey === "") {
          setSearchValue("");
        }
      })();
    },
    800,
    [searchKey]
  );

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );
  if (loading) return <Progress />;
  return (
    <div className="w-full relative">
      <Header />
      <div className="p-[37px_30px]">
        <Modal
          isOpen={nameModalOpen}
          onClose={() => {
            setNameModalOpen(false);
          }}
        >
          <NameTemplate isPrimary={true} />
        </Modal>
        <div>
          <Grid
            container
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            padding={"20px"}
            height={"104px"}
          >
            <h3 className="font-[Inter] font-semibold text-[25px] leading-[38px]">
              All People
            </h3>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                onClick={redirectUses}
              >
                Create Person
              </button>
            </div>
          </Grid>
          <div className="flex w-full gap-[10px] lg:px-8">
            <AutoComplete
              inputId="keyInput"
              items={possibleKeys}
              inputValue={searchKey}
              wrapperClassNames="w-full"
              customLabelClassNames="mb-[4px]"
              customInputClassNames="!shadow-sm !border-[1px] !border-gray-300"
              onInputChange={(e) => setSearchKey(e.target.value)}
              label="Customer key (String only)"
              onOptionSelect={(el) => {
                setSearchKey(el.key);
              }}
              optionKey={(el) => `${el.key}(${el.type})`}
              optionRender={(el) => `${el.key} (${el.type})`}
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
            data={people}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            isShowDisabled={showFreezed}
            setIsShowDisabled={setShowFreezed}
            showDisabledText="Show freezed"
          />
        </div>
      </div>
    </div>
  );
};

export default PeopleTable;
