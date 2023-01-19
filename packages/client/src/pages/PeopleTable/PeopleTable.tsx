import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameTemplate from "./NamePerson";
import Modal from "components/Elements/Modal";
import { useEffect, useState } from "react";
import Progress from "components/Progress";

const PeopleTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [people, setPeople] = useState<Record<string, any>[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllPeople}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }`,
        });
        const { data: fetchedPeople, totalPages } = data;
        setPagesCount(totalPages);
        setPeople(fetchedPeople);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    setLoadingAsync();
  }, [itemsPerPage, currentPage]);

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
          <TableTemplate
            data={people}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
      </div>
    </div>
  );
};

export default PeopleTable;
