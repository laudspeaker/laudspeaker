import { MouseEvent, useState } from "react";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { Workflow } from "types/Workflow";
import ToggleWithLabel from "components/ToggleWithLabel";

const NameJourney = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [isUseNewUI, setIsUseNewUI] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await ApiService.post<Workflow>({
        url: "/journeys",
        options: { name },
      });
      navigate("/flow/" + data.id);
    } catch (err) {
      let message = "Unexpected error";
      if (err instanceof AxiosError) message = err.response?.data.message;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="items-start flex justify-center pt-[18px] mb-[50px]">
        <div className="w-full">
          <h3 className="font-bold text-[25px] font-[Poppins] text-[#28282E] leading-[38px]">
            Name your Journey
          </h3>
          <Input
            isRequired
            value={name}
            placeholder={"Enter name"}
            name="name"
            id="name"
            className="w-full p-[16px] bg-white border-[1px] border-[#D1D5DB] font-[Inter] text-[16px]"
            onChange={(e) => setName(e.target.value)}
          />
          {/* <ToggleWithLabel
            label="Use new UI (experimental)"
            enabled={isUseNewUI}
            onChange={setIsUseNewUI}
          /> */}
          <div className="flex justify-end mt-[10px]">
            <GenericButton
              id="createJourneySubmit"
              customClasses="inline-flex items-center rounded-md border inline-flex items-center border border-transparent bg-[#6366F1] px-6 py-3 text-base font-medium text-white shadow-sm hover:border-[#818CF8] hover:bg-[#818CF8] focus:border-[#4338CA] focus:bg-[#4338CA] disabled:!bg-[#F3F4F6] rounded-md"
              onClick={handleSubmit}
              style={{
                maxWidth: "200px",
              }}
              loading={isLoading}
            >
              Create
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameJourney;
