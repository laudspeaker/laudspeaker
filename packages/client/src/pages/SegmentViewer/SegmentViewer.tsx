import { GenericButton, Input } from "components/Elements";
import Header from "components/Header";
import Progress from "components/Progress";
import { TableTemplate } from "components/TableTemplate";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import ApiService from "services/api.service";

const SegmentViewer = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "" });
  const [customers, setCustomers] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOptions, setSortOptions] = useState({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: segmentData } = await ApiService.get({
        url: `/segments/${id}`,
      });

      const { name, description, type } = segmentData;

      if (type === "automatic") {
        navigate("/segment");
        toast.error("Not implemented");
      }

      setSegmentForm({ name, description });

      const { data: customersData } = await ApiService.get({
        url: `/segments/${id}/customers?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
          Object.values(sortOptions)[0] || ""
        }&showDeleted=${showDeleted}`,
      });
      const { data: fetchedCustomers, totalPages } = customersData;
      setPagesCount(totalPages);
      setCustomers(fetchedCustomers);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemsPerPage, currentPage, sortOptions, showDeleted]);

  const handleSave = async () => {
    setTitleEdit(false);
    setIsSaving(true);
    try {
      await ApiService.patch({ url: "/segments/" + id, options: segmentForm });
    } catch (e) {
      toast.error("Error while saving segment");
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
      <Header />
      <div className="py-[37px] px-[30px]">
        <div>
          <div className="flex justify-between items-center p-[20px] h=[104px]">
            {titleEdit ? (
              <div>
                <Input
                  name="name"
                  label="name"
                  value={segmentForm.name}
                  onChange={(e) =>
                    setSegmentForm({ ...segmentForm, name: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && setTitleEdit(false)}
                />
                <Input
                  name="description"
                  label="description"
                  value={segmentForm.description}
                  onChange={(e) =>
                    setSegmentForm({
                      ...segmentForm,
                      description: e.target.value,
                    })
                  }
                  onKeyDown={(e) => e.key === "Enter" && setTitleEdit(false)}
                />
              </div>
            ) : (
              <div>
                <h3 className="font-[Inter] font-semibold text-[25px] leading-[38px] flex items-center">
                  {segmentForm.name}
                  <span
                    className="ml-[10px] cursor-pointer"
                    onClick={() => setTitleEdit(true)}
                  >
                    <PencilIcon width={20} height={20} />
                  </span>
                </h3>
                <h6>{segmentForm.description}</h6>
              </div>
            )}

            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <GenericButton
                id="createTemplate"
                customClasses="inline-flex items-center border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md focus:ring-cyan-500"
                onClick={handleSave}
                loading={isSaving || loading}
              >
                Save Segment
              </GenericButton>
            </div>
          </div>
          <TableTemplate
            data={customers}
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
          />
        </div>
      </div>
    </div>
  );
};

export default SegmentViewer;
