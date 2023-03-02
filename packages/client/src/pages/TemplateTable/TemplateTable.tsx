import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameTemplate from "./NameTemplate";
import Modal from "../../components/Elements/Modal";
import Template from "types/Template";
import Progress from "components/Progress";
import { GenericButton } from "components/Elements";
import { toast } from "react-toastify";

const TemplateTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState("");
  const [usedJourneysByTemplateToDelete, setUsedJourneysByTemplateToDelete] =
    useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `${ApiConfig.getAllTemplates}?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
          Object.values(sortOptions)[0] || ""
        }&showDeleted=${showDeleted}`,
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

  useEffect(() => {
    loadData();
  }, [itemsPerPage, currentPage, sortOptions, showDeleted]);

  useEffect(() => {
    if (!templateToDelete) return;

    (async () => {
      const { data } = await ApiService.get<string[]>({
        url: `/templates/${templateToDelete}/usedInJourneys`,
      });

      setUsedJourneysByTemplateToDelete(data);
    })();
  }, [templateToDelete]);

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const handleNameSubmit = () => {};

  const handleDeleteTemplate = async () => {
    await toast.promise(
      ApiService.delete({ url: `/templates/${templateToDelete}` }),
      {
        pending: { render: "Deleting template...", type: "info" },
        success: { render: "Delete success!", type: "success" },
        error: { render: "Delete failed!", type: "error" },
      }
    );

    setTemplateToDelete("");
    await loadData();
  };

  //getAlltemplatesData();

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
            isShowDisabled={showDeleted}
            setIsShowDisabled={setShowDeleted}
            setTemplateToDelete={setTemplateToDelete}
          />
          <Modal
            isOpen={!!templateToDelete}
            onClose={() => setTemplateToDelete("")}
          >
            <div>
              {usedJourneysByTemplateToDelete.length > 0 ? (
                <>
                  <div>
                    <p>
                      To delete template remove it from journeys and stop active
                      journeys which use this template:
                    </p>
                    <div className="max-h-[100px] overflow-y-scroll">
                      <ul className="list-disc pl-[30px]">
                        {usedJourneysByTemplateToDelete.map((name) => (
                          <li>{name}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-[10px]">
                      <GenericButton onClick={() => setTemplateToDelete("")}>
                        Close
                      </GenericButton>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div>Are you sure you want to delete this template?</div>
                    <div className="flex justify-between items-center mt-[10px]">
                      <GenericButton
                        customClasses="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        onClick={handleDeleteTemplate}
                      >
                        Yes
                      </GenericButton>
                      <GenericButton
                        customClasses="grayscale"
                        onClick={() => setTemplateToDelete("")}
                      >
                        No
                      </GenericButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default TemplateTable;
