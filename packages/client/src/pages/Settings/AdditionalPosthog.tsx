import Header from "components/Header";
import { Input, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import {
  setSettingData,
  startPosthogImport,
  updateUserData,
} from "reducers/settings";

function AdditionalPosthog() {
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [defaultName, setDefaultName] = useState<string>(
    settings.defaultName || ""
  );
  const [defaultEmail, setDefaultEmail] = useState<string>(
    settings.defaultEmail || ""
  );
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const navigate = useNavigate();
  const moveToCompletion = async () => {
    console.log("start import pls");
    await startPosthogImport();
    dispatch(setSettingData({ ...settings, eventsCompleted: true }));
    navigate("/settings/network-configuration");
  };
  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Ready to Sync Posthog users?
          </h3>
          <p className="text-[18px] mb-[35px]">
            Once this is done, we will email you on how to add the posthog app
            extension..
          </p>
          <div className="flex mt-[10%] justify-start">
            <GenericButton
              onClick={moveToCompletion}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Sync
            </GenericButton>
          </div>
        </div>
        <div className="bg-white rounded-3xl w-full max-w-[465px] max-h-[auto]">
          <div className="p-[20px] flex flex-col gap-[16px]">
            <h3 className="text-black">Your Setup List</h3>
            <p className="text-[#6B7280]">
              Youre only a few steps away from your first message
            </p>
          </div>
          <CustomStepper activeStep={4} />
        </div>
      </div>
    </div>
  );
}

export default AdditionalPosthog;
