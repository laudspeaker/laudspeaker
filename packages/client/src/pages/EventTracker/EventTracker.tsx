import Progress from "components/Progress";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import tickIcon from "assets/images/tick.svg";
import { useDebounce } from "react-use";
import AceEditor from "react-ace";
import "ace-builds/webpack-resolver";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-json";
import Autocomplete from "components/Autocomplete";

interface PosthogEvent {
  name: string;
  type: string;
  payload: string;
  createdAt: string;
  errorMessage?: string;
}

const EventTracker = () => {
  const [loading, setLoading] = useState(false);

  const [posthogEvents, setPosthogEvents] = useState<PosthogEvent[]>([]);
  const [selectedPosthogEvent, setSelectedPosthogEvent] =
    useState<PosthogEvent>();

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesCount, setPagesCount] = useState(1);

  const [searchName, setSearchName] = useState("");
  const [possibleNames, setPossibleNames] = useState<string[]>([]);

  const isSkipped = (num?: number) => {
    if (!num) return false;
    return Math.abs(currentPage - num) > 1 && num > 2 && num < pagesCount - 3;
  };

  const loadData = async () => {
    setSelectedPosthogEvent(undefined);
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `/events/posthog-events?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&search=${searchName}`,
      });
      const {
        data: fetchedPosthogEvents,
        totalPages,
      }: { data: PosthogEvent[]; totalPages: number } = data;
      setPagesCount(totalPages);
      setPosthogEvents(fetchedPosthogEvents);
      setPossibleNames(
        fetchedPosthogEvents
          .map((posthogEvent) => posthogEvent.name)
          .reduce(
            (acc, el) => (acc.includes(el) ? acc : acc.concat([el])),
            [] as string[]
          )
      );
    } catch (err) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemsPerPage, currentPage]);

  useDebounce(
    () => {
      loadData();
    },
    800,
    [searchName]
  );

  if (loading) return <Progress />;

  return (
    <div className="min-h-[100vh] max-h-[100vh] px-[50px] py-[10px]">
      <div className="max-w-[300px] mb-[10px]">
        <Autocomplete
          inputId="searchName"
          items={possibleNames}
          inputValue={searchName}
          wrapperClassNames="w-full"
          customLabelClassNames="mb-[4px]"
          customInputClassNames="!shadow-sm !border-[1px] !border-gray-300"
          onInputChange={(e) => setSearchName(e.target.value)}
          label="Name"
          onOptionSelect={(name) => {
            setSearchName(name);
          }}
          optionKey={(name) => name}
          optionRender={(name) => name}
        />
      </div>
      <div className="flex">
        <div className="w-1/2">
          <div className="overflow-y-scroll max-h-[calc(100vh-160px)] px-[5px]">
            <table className="w-full bg-gray-200 rounded-md">
              <thead>
                <tr className="border-[2px] border-gray-300 text-gray-800">
                  <th className="w-1/2 py-[10px]">Name</th>
                  <th className="py-[10px]">Error</th>
                </tr>
              </thead>
              <tbody>
                {posthogEvents.map((posthogEvent) => (
                  <tr
                    className={`border-[2px] border-gray-300 cursor-pointer hover:bg-cyan-100 hover:bg-opacity-30 ${
                      selectedPosthogEvent === posthogEvent
                        ? "ring-cyan-700 ring-2"
                        : ""
                    }`}
                    onClick={() => setSelectedPosthogEvent(posthogEvent)}
                  >
                    <td className="pl-[10px]">
                      <div className="flex">
                        <div className="flex justify-center items-center">
                          <img
                            src={tickIcon}
                            className="w-[25px] min-w-[25px]"
                          />
                        </div>
                        <div className="text-[14px] px-[10px] py-[15px]">
                          <div className="font-bold">{posthogEvent.name}</div>
                          <div className="font-normal text-gray-600">
                            {posthogEvent.type}
                          </div>
                          <div className="font-normal text-gray-600">
                            {new Date(posthogEvent.createdAt).toUTCString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      {posthogEvent.errorMessage || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-[10px]">
            <div
              className="isolate !border-none inline-flex -space-x-px rounded-md shadow-sm mx-[50px] mb-[20px] items-end"
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
                    currentPage === 0 ? pagesCount - 1 : currentPage - 1
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
                const isSelected = currentPage === i;
                return (
                  <div
                    key={i}
                    className={`relative flex-row justify-center items-start pt-[16px] px-[16px] cursor-pointer`}
                    onClick={() => {
                      setCurrentPage(i);
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
                    currentPage === pagesCount - 1 ? 0 : currentPage + 1
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
        <div className="w-1/2 px-[10px]">
          <div className="bg-gray-200 rounded-md border-[2px] border-gray-300">
            <div className="ml-[20px] text-[16px] font-bold text-gray-800 py-[10px]">
              Payload
            </div>
            <div className="max-h-[90vh]">
              <AceEditor
                aria-label="editor"
                mode="json"
                theme="github"
                name="editor"
                fontSize={12}
                minLines={15}
                maxLines={40}
                width="100%"
                showPrintMargin={false}
                showGutter
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                }}
                value={selectedPosthogEvent?.payload}
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTracker;
