import React, { FC, useState, useEffect } from "react";
import ApiService from "services/api.service";
import { DatabaseStepProps } from "../Database";
import { toast } from "react-toastify";
import Progress from "components/Progress";

const DatabaseStep5: FC<DatabaseStepProps> = ({
  formData,
  isLoading,
  setIsLoading,
}) => {
  const [tableData, setTableData] = useState<Record<string, string | number>[]>(
    []
  );

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.post<
          Record<string, string | number>[]
        >({
          url: "/integrations/db/review",
          options: formData,
        });

        console.log(data);
        setTableData(data);
      } catch (e) {
        toast.error("There is something wrong with your connection or query");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [formData]);

  if (isLoading) return <Progress />;

  const header = Object.keys(tableData[0] || {});

  return (
    <div className="relative">
      <div className="space-y-1 pb-[10px]">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Review</h3>
        <p className="max-w-2xl text-sm text-gray-500">
          Check if query data is correct.
        </p>
      </div>
      <div className="max-h-[50vh] overflow-scroll">
        <table className="text-[10px]">
          <thead>
            <tr>
              {header.map((item) => (
                <td className="border-[1px] border-black">{item}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr>
                {Object.values(row).map((item) => (
                  <td className="max-h-[10px] border-[1px] border-black">
                    {item}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatabaseStep5;
