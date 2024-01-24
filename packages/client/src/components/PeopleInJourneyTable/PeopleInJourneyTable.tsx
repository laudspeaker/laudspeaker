import Pagination from "components/Pagination";
import Table from "components/Tablev2";
import { format } from "date-fns";
import { journeyStatusClassName } from "pages/JourneyTablev2/JourneyTablev2";
import { useEffect, useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import emptyDataImage from "../../pages/JourneyTablev2/svg/empty-data.svg";

interface Journey {
  id: string;
  name: string;
  isFinished: boolean | null;
  currentStepId: string | null;
  enrollmentTime: Date | null;
}

interface CustomerJourneysResponse {
  data: Journey[];
  total: number;
}

const ELEMENTS_PER_PAGE = 10;

const PeopleInJourneyTable = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [journeys, setJourneys] = useState<
    CustomerJourneysResponse | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `/customers/${id}/getJourneys?take=${ELEMENTS_PER_PAGE}&skip=${
          (page - 1) * ELEMENTS_PER_PAGE
        }`,
      });
      setJourneys(data);
      setTotalPages(Math.ceil((journeys?.total || 0) / ELEMENTS_PER_PAGE));
    } catch (error) {
      toast.error("Can't get info about user");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refetch();
  }, [page]);

  return (
    <div className="flex flex-col h-full">
      {!(!isLoading && !journeys?.data.length) ? (
        <>
          <Scrollbars>
            <Table
              className="w-full"
              isLoading={isLoading}
              headings={[
                <div className="px-[16px] font-[Inter] text-[14px] font-semibold leading-[22px] bg-white py-[10px] select-none">
                  Journey
                </div>,
                <div />,
                <div />,
                <div />,
                <div />,
                <div />,
                <div className="px-[16px] font-[Inter] text-[14px] font-semibold leading-[22px] bg-white py-[10px] select-none">
                  Status
                </div>,
                <div className="px-[16px] font-[Inter] text-[14px] font-semibold leading-[22px] bg-white py-[10px] select-none">
                  Enrollment time
                </div>,
              ]}
              rowsData={journeys?.data || []}
              rows={journeys?.data?.map((row) => [
                <button
                  className="text-[#6366F1] font-[Inter] text-[14px] leading-[22px]"
                  onClick={() =>
                    navigate(`/flow/${row.id}/view`, {
                      state: {
                        stepId: row.currentStepId,
                      },
                    })
                  }
                >
                  {row.name}
                </button>,
                <div />,
                <div />,
                <div />,
                <div />,
                <div />,
                <div
                  className={`px-[10px] py-[2px] rounded-[14px] font-[Inter] text-[14px] leading-[22px] w-fit ${
                    row.isFinished
                      ? journeyStatusClassName.Active
                      : journeyStatusClassName.Stopped
                  }`}
                >
                  {row.isFinished ? "Finished" : "Enrolled"}
                </div>,
                <div className="font-[Inter] text-[14px] leading-[22px]">
                  {row.enrollmentTime
                    ? format(new Date(row.enrollmentTime), "dd/MM/yyyy HH:mm")
                    : "Unknown"}
                </div>,
              ])}
            />
          </Scrollbars>
          {totalPages > 0 && (
            <div className="w-full pt-[20px] flex justify-center mt-auto">
              <Pagination
                currentPage={page}
                setCurrentPage={setPage}
                totalPages={totalPages}
              />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-[300px] my-auto flex items-center justify-center select-none">
          <div className="flex flex-col items-center gap-5">
            <img src={emptyDataImage} />

            <div className="font-inter text-[16px] font-semibold leading-[24px] text-[#4B5563]">
              Customer not enrolled in any journey
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PeopleInJourneyTable;
