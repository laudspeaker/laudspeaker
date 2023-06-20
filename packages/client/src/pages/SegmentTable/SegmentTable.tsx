import { Grid } from "@mui/material";
import { GenericButton } from "components/Elements";
import Modal from "components/Elements/Modal";
import Header from "components/Header";
import Progress from "components/Progress";
import { TableTemplate } from "components/TableTemplate";
import React, { useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import NameSegment, { INameSegmentForm } from "./NameSegment";

const SegmentTable = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const [segments, setSegments] = useState<{ name: string; id: string }[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string>();
  const [usedInWorkflow, setUsedInWorkflow] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `/segments?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
          Object.values(sortOptions)[0] || ""
        }&showDeleted=${showDeleted}`,
      });
      const { data: fetchedSegments, totalPages } = data;
      setPagesCount(totalPages);
      setSegments(fetchedSegments);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemsPerPage, currentPage, sortOptions, showDeleted]);

  const handleDeleteSegment = (segmentId: string) => {
    confirmAlert({
      title: "",
      message: `Are you sure you want to delete segment ${
        segments.find((segment) => segment.id === segmentId)?.name
      }?`,
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            await ApiService.delete({
              url: `/segments/${segmentId}`,
              options: {
                segmentId,
              },
            });
            loadData();
          },
        },
        {
          label: "No",
        },
      ],
    });
    setSegmentToDelete("");
  };

  useEffect(() => {
    if (!segmentToDelete) return;

    (async () => {
      const { data } = await ApiService.get({
        url: `/segments/${segmentToDelete}/user-in-workflows`,
      });

      if (data.length > 0) {
        setUsedInWorkflow(data);
      } else {
        handleDeleteSegment(segmentToDelete);
      }
    })();
  }, [segmentToDelete]);

  const handleNameSubmit = async (segmentForm: INameSegmentForm) => {
    setIsSaving(true);
    try {
      const { data } = await ApiService.post({
        url: "/segments",
        options: segmentForm,
      });
      toast.success("Successfully created segment");
      setNameModalOpen(false);

      navigate("/segment/" + data.id);
    } catch (e) {
      toast.error("Error while saving a segment");
    } finally {
      setIsSaving(false);
    }
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
      <div className="py-[37px] px-[30px]">
        <Modal
          isOpen={nameModalOpen}
          onClose={() => setNameModalOpen(false)}
          onEnterPress={() => setNameModalOpen(false)}
          panelClass="!max-w-none"
        >
          <NameSegment onSubmit={handleNameSubmit} />
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
              All Segments
            </h3>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <GenericButton
                id="createTemplate"
                customClasses="inline-flex items-center border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md focus:ring-cyan-500"
                onClick={() => setNameModalOpen(true)}
                loading={isSaving || loading}
              >
                Create Segment
              </GenericButton>
            </div>
          </Grid>
          <TableTemplate
            data={segments}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            sortOptions={sortOptions}
            setSortOptions={setSortOptions}
            isShowDisabled={showDeleted}
            setIsShowDisabled={setShowDeleted}
            refresh={loadData}
            showDeletedToggle={false}
            setSegmentToDelete={setSegmentToDelete}
          />
        </div>

        <Modal
          isOpen={!!segmentToDelete}
          onClose={() => setSegmentToDelete("")}
        >
          <div>
            {usedInWorkflow.length > 0 && (
              <>
                <div>
                  <p>
                    To delete segment remove it from journeys and stop active
                    journeys which use this segment:
                  </p>
                  <div className="max-h-[100px] overflow-y-scroll">
                    <ul className="list-disc pl-[30px]">
                      {usedInWorkflow.map((name) => (
                        <li>{name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-[10px]">
                    <GenericButton onClick={() => setSegmentToDelete("")}>
                      Close
                    </GenericButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SegmentTable;
