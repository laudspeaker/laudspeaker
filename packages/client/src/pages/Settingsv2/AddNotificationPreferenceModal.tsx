import React from "react";
import Modal from "components/Elements/Modal";
import Input from "components/Elements/Inputv2";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import { useAppSelector } from "store/hooks";
import { useDispatch } from "react-redux";
import { setJourneySettingsTags } from "reducers/flow-builder.reducer";
import TagComponent from "components/TagComponent/TagComponent";

interface AddNotificationPreferenceModalProps {
  connectedFixtures: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (preference: {
    name: string;
    title: string;
    description: string;
    selectedChannels: string[];
    tags: string[];
  }) => void;
}

const AddNotificationPreferenceModal: React.FC<
  AddNotificationPreferenceModalProps
> = ({ isOpen, onClose, onSave, connectedFixtures }) => {
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedChannels, setSelectedChannels] = React.useState<string[]>([]);
  const { journeySettings, availableTags } = useAppSelector(
    (store) => store.flowBuilder
  );
  const [searchTagsValue, setSearchTagsValue] = React.useState("");
  const resetFields = () => {
    setName("");
    setTitle("");
    setDescription("");
    setSelectedChannels([]);
    setJourneySettingsTags([]);
  };
  const handleSave = () => {
    onSave({
      name,
      title,
      description,
      selectedChannels,
      tags: journeySettings.tags,
    });
    resetFields();
    onClose();
  };
  const dispatch = useDispatch();
  const handleChannelChange = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="text-[20px] font-semibold leading-[28px] text-base  text-[#111827] font-inter">
          Add a Notification Preference
        </div>
        <div className="bg-white p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <div className="text-sm font-inter text-[#111827] mb-[5px]">
              Preference Name
            </div>
            <Input
              value={name}
              onChange={(value: string) => setName(value)}
              placeholder="digest journeys"
              wrapperClassName="!max-w-full w-full"
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-inter text-[#111827] mb-[5px]">
              Title
            </div>
            <Input
              value={title}
              onChange={(value: string) => setTitle(value)}
              placeholder="Developer Digest"
              wrapperClassName="!max-w-full w-full"
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-inter text-[#111827] mb-[5px]">
              Description
            </div>
            <Input
              value={description}
              onChange={(value) => setDescription(value)}
              placeholder="Updates about our API and developer platform"
              wrapperClassName="!max-w-full w-full"
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-inter text-[#111827] mb-[5px]">
              Journey Tags
            </div>
            <div className="max-w-[800px]">
              <TagComponent
                tags={journeySettings.tags}
                possibleTags={availableTags.filter((el) =>
                  el.includes(searchTagsValue)
                )}
                onTagChange={(tags) => {
                  dispatch(setJourneySettingsTags(tags));
                }}
                onInputChange={setSearchTagsValue}
              />
            </div>
          </div>
          {/* <div className="flex flex-col">
            <div className="text-sm font-inter text-[#111827] mb-[5px]">
              Channels
            </div>
            <div className="grid grid-cols-2 gap-3">
              {connectedFixtures.map((fixture) => (
                <label
                  key={fixture.id}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(fixture.id)}
                    onChange={() => handleChannelChange(fixture.id)}
                    className="h-4 w-4"
                  />
                  <span>{fixture.name}</span>
                </label>
              ))}
            </div>
          </div> */}
          <div className="flex justify-end gap-4 mt-5">
            <Button type={ButtonType.SECONDARY} onClick={onClose}>
              Cancel
            </Button>
            <Button type={ButtonType.PRIMARY} onClick={handleSave}>
              Save Preference
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddNotificationPreferenceModal;
