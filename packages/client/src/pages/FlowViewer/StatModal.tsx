import Modal from "components/Elements/Modal";
import React, { FC, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const [customers, setCustomers] = useState<Record<string, any>[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  const [isLoading, setIsLoading] = useState(false);

  const isSkipped = (num?: number) => {
    if (!num) return false;
    return Math.abs(currentPage - num) > 1 && num > 2 && num < pagesCount - 3;
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const {
          data: { data, totalPages },
        } = await ApiService.get<{
          data: Record<string, any>[];
          totalPages: number;
        }>({
          url: `/customers/audienceStats?event=${event}&audienceId=${audienceId}&take=${ITEMS_PER_PAGE}&skip=${
            (currentPage - 1) * ITEMS_PER_PAGE
          }`,
        });
        setCustomers(data || []);
        setPagesCount(totalPages);
        setIsLoading(false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [event, audienceId, currentPage]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<>{title} Users</>}>
      <div>
        <div className="overflow-y-scroll overflow-x-hidden max-h-[70vh] lg:max-h-[50vh]">
          {customers.map((customer) => (
            <>
              <Link to={"/person/" + customer.id}>
                <div>{customer.email || customer.slackEmail}</div>
              </Link>
              <hr />
            </>
          ))}
        </div>
        <div className="flex justify-between max-h-[70vh]">
          <div
            className="isolate !border-none inline-flex -space-x-px rounded-md shadow-sm mx-[10px] mb-[20px] items-end"
            aria-label="Pagination"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cursor-pointer mr-[10px]"
              onClick={() => {
                setCurrentPage(
                  currentPage === 1 ? pagesCount : currentPage - 1
                );
              }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.70711 9.70711C5.31658 10.0976 4.68342 10.0976 4.2929 9.70711L0.292894 5.70711C-0.0976312 5.31658 -0.0976312 4.68342 0.292894 4.29289L4.29289 0.292894C4.68342 -0.0976312 5.31658 -0.0976312 5.70711 0.292894C6.09763 0.683417 6.09763 1.31658 5.70711 1.70711L3.41421 4L15 4C15.5523 4 16 4.44771 16 5C16 5.55228 15.5523 6 15 6L3.41421 6L5.70711 8.29289C6.09763 8.68342 6.09763 9.31658 5.70711 9.70711Z"
                fill="#E5E5E5"
              />
            </svg>
            {[...new Array(pagesCount)].map((_, i) => {
              if (isSkipped(i) && isSkipped(i - 1)) return;
              const content = isSkipped(i) ? "..." : i + 1;
              const isSelected = currentPage === i + 1;
              return (
                <div
                  key={i}
                  className={`relative flex-row justify-center items-start pt-[16px] px-[16px] cursor-pointer`}
                  onClick={() => {
                    setCurrentPage(i + 1);
                  }}
                >
                  <span
                    className={`${
                      isSelected
                        ? "bg-cyan-500 !bg-clip-text text-transparent"
                        : ""
                    }  font-[Poppins] font-medium text-[14px] leading-[26px]`}
                  >
                    {content}
                  </span>
                  <div
                    className={`${
                      !isSelected && "opacity-0"
                    } transition-all absolute top-[-1px] h-[2px] left-0 w-full bg-cyan-500`}
                  />
                </div>
              );
            })}
            <svg
              width="20"
              height="20"
              viewBox="0 0 18 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cursor-pointer ml-[10px]"
              onClick={() => {
                setCurrentPage(
                  currentPage === pagesCount ? 1 : currentPage + 1
                );
              }}
            >
              <path
                d="M13.1667 1.66602L16.5 4.99935M16.5 4.99935L13.1667 8.33268M16.5 4.99935L1.5 4.99935"
                stroke="#E5E5E5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StatModal;
