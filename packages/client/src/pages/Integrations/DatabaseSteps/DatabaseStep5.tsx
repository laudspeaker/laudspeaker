import React, { FC, useState, useEffect, Dispatch } from "react";
import ApiService from "services/api.service";
import { DatabaseStepProps } from "../Database";
import { toast } from "react-toastify";
import Progress from "components/Progress";

const DatabaseStep5: FC<
  DatabaseStepProps & { setIsSuccess: Dispatch<React.SetStateAction<boolean>> }
> = ({ formData, isLoading, setIsLoading, setIsSuccess }) => {
  const [tableData, setTableData] =
    useState<Record<string, string | number>[]>();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const { data } = await ApiService.post<
          Record<string, string | number>[]
        >({
          url: "/integrations/db/review",
          options: formData,
        });

        console.table(data);
        setTableData(data);
        setIsSuccess(true);
      } catch (e) {
        toast.error("There is something wrong with your connection or query");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [formData]);

  if (isLoading) return <Progress />;

  const header = Object.keys(tableData?.[0] || {});

  return (
    <div className="relative">
      <div className="space-y-1 pb-[10px]">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Review</h3>
        <p className="max-w-2xl text-sm text-gray-500">
          Check if query data is correct.
        </p>
      </div>
      {tableData ? (
        <div className="max-h-[50vh] overflow-scroll">
          <table className="text-[10px]">
            <thead className="bg-[#FAFAFA]">
              <tr>
                {header.map((item) => (
                  <td className="border-r-[1px] border-b-[1px] border-b-[#F0F0F0] border-r-[#EBEBEB] whitespace-nowrap px-3">
                    <b>{item}</b>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr>
                  {Object.values(row).map((item) => (
                    <td className="max-h-[10px] border-b-[1px] border-b-[#EBEBEB] whitespace-nowrap">
                      {item}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex justify-center items-center text-gray-400 text-[48px] border-[2px]  rounded-md">
          NO DATA
        </div>
      )}
    </div>
  );
};

export default DatabaseStep5;
