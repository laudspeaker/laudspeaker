import { TableTemplate } from "components/TableTemplate";
import { ApiConfig } from "../../constants";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";
import Progress from "components/Progress";
import { TableDataItem } from "components/TableTemplate/TableTemplate";

interface SegmentCustomerPickerProps {
  segmentId: string;
}

const SegmentCustomerPicker: FC<SegmentCustomerPickerProps> = ({
  segmentId,
}) => {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Record<string, any>[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllPeople}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }&checkInSegment=${segmentId}`,
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
    setLoadingAsync();
  }, [itemsPerPage, currentPage]);

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

  if (loading) return <Progress />;

  return (
    <div>
      <TableTemplate
        className="max-h-[70vh]"
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
