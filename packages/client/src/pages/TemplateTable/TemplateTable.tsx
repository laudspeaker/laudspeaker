import React, { useState } from "react";
import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameTemplate from "./NameTemplate";
import Modal from "../../components/Elements/Modal";
import Template from "types/Template";

const TemplateTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState({});

  React.useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllTemplates}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
            Object.values(sortOptions)[0] || ""
          }`,
        });
        const { data: fetchedTemplates, totalPages } = data;
        setPagesCount(totalPages);
        setTemplates(fetchedTemplates);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    setLoadingAsync();
  }, [itemsPerPage, currentPage, sortOptions]);

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const handleNameSubmit = () => {};

  //getAlltemplatesData();

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );
  if (loading)
    return (
      <div>
        <p style={{ textAlign: "center" }}>One moment</p>
      </div>
    );
  return (
    <div className="w-full relative">
      <Header />
      <div className="py-[37px] px-[30px]">
        <Modal
          isOpen={nameModalOpen}
          onClose={() => {
            setNameModalOpen(false);
          }}
          onEnterPress={handleNameSubmit}
        >
          <NameTemplate onSubmit={handleNameSubmit} isPrimary={true} />
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
              All Templates
            </h3>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <button
                id="createTemplate"
                type="button"
                className="inline-flex items-center border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md focus:ring-cyan-500"
                onClick={redirectUses}
              >
                Create Template
              </button>
            </div>
          </Grid>
          <TableTemplate
            data={templates}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            sortOptions={sortOptions}
            setSortOptions={setSortOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateTable;
