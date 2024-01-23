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
import Input from "components/Elements/Inputv2";
import Table from "components/Tablev2";
import { format } from "date-fns";
import CopyIcon from "assets/icons/CopyIcon";
import Pagination from "components/Pagination";
import SearchIcon from "assets/icons/SearchIcon";

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

  const handleSelectPosthogEvent = (posthogEvent: PosthogEvent) => {
    setSelectedPosthogEvent(posthogEvent);
  };

  if (loading) return <Progress />;

  return (
    <div className="p-5 flex flex-col gap-6 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="text-black text-[20px] font-semibold leading-[28px]">
        Event Tracker
      </div>
      <div className="bg-white rounded-lg flex">
        <div className="w-full p-5 border-r border-[#F3F4F6] flex flex-col gap-5">
          <div className="relative">
            <Input
              value={searchName}
              onChange={(value) => setSearchName(value)}
              placeholder="Search all events"
              wrapperClassName="!w-[200px]"
              className="!w-full !pl-[38px]"
            />
            <div className="absolute top-1/2 -translate-y-1/2 left-[12px]">
              <SearchIcon />
            </div>
          </div>

          <div className="relative rounded w-full overflow-hidden border-x border-t border-[#E5E7EB]">
            <Table
              headings={[
                <div className="px-5 h-[44px] flex items-center">Event</div>,
                <div className="px-5 h-[44px] flex items-center"></div>,
                <div className="px-5 h-[44px] flex items-center">
                  Last update
                </div>,
              ]}
              rowsData={posthogEvents}
              rows={posthogEvents.map((posthogEvent) => [
                <div
                  className="flex items-center h-[56px]"
                  onClick={() => handleSelectPosthogEvent(posthogEvent)}
                >
                  {posthogEvent.name}
                </div>,
                <div
                  className="flex items-center h-[56px] text-[#F43F5E]"
                  onClick={() => handleSelectPosthogEvent(posthogEvent)}
                >
                  {posthogEvent.errorMessage}
                </div>,
                <div
                  className="flex items-center h-[56px]"
                  onClick={() => handleSelectPosthogEvent(posthogEvent)}
                >
                  {format(new Date(posthogEvent.createdAt), "MM/dd/yyyy HH:mm")}
                </div>,
              ])}
              className="w-full"
              headClassName="bg-[#F3F4F6]"
              selectedRow={
                selectedPosthogEvent
                  ? posthogEvents.indexOf(selectedPosthogEvent)
                  : -1
              }
              onRowClick={(i) => setSelectedPosthogEvent(posthogEvents[i])}
            />
          </div>

          {pagesCount > 1 && (
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={pagesCount}
            />
          )}
        </div>
        <div className="w-full p-5">
          <div className="border border-[#E5E7EB] rounded overflow-hidden mt-[52px]">
            <div className="px-5 h-[44px] flex justify-between items-center bg-[#F3F4F6] border-b border-[#E5E7EB]">
              <div className="font-semibold">Payload</div>
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (!selectedPosthogEvent?.payload) return;

                  navigator.clipboard.writeText(selectedPosthogEvent.payload);
                }}
              >
                <CopyIcon />
              </div>
            </div>
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
  );
};

export default EventTracker;
