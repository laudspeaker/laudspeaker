import Modal from "components/Elements/Modal";
import React, { FC, useEffect, useState } from "react";
import ApiService from "services/api.service";

interface StatModalProps {
  event: string;
  audienceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 50;

const StatModal: FC<StatModalProps> = ({
  event,
  audienceId,
  isOpen,
  onClose,
}) => {
  const arr = event.split("");
  arr[0] = arr[0].toUpperCase();
  const title = arr.join("");

  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const { data } = await ApiService.get({
          url: `/customers/audienceStats?event=${event}&audienceId=${audienceId}&take=${ITEMS_PER_PAGE}&skip=${
            (page - 1) * ITEMS_PER_PAGE
          }`,
        });
        setCustomers(customers.concat(data));
        setIsLoading(false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [event, audienceId, page]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<>{title} Users</>}>
      <div
        className="overflow-y-scroll overflow-x-hidden max-h-[70vh] lg:max-h-[50vh]"
        onScroll={(e: React.UIEvent<HTMLDivElement>) => {
          if (
            !isLoading &&
            e.currentTarget.scrollHeight - 20 - e.currentTarget.scrollTop <
              e.currentTarget.clientHeight
          ) {
            setPage(page + 1);
          }
        }}
      >
        {customers.map((customer) => (
          <>
            <div>{customer.email || customer.slackEmail}</div>
            <hr />
          </>
        ))}
      </div>
    </Modal>
  );
};

export default StatModal;
