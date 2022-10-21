import { Grid } from "@mui/material";
import Header from "components/Header";
import CustomStepper from "./components/CustomStepper";
import { resetSetttingsData } from "reducers/settings";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { GenericButton } from "components/Elements";
import { useNavigate } from "react-router-dom";

function Completion() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNext: any = async (e: any) => {
    //e.preventDefault();
    navigate("/flow");
  };

  useEffect(() => {
    dispatch(resetSetttingsData());
  }, []);
  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex font-[Inter] font-semibold items-center text-[25px] gap-[10px] leading-[40px] mb-[10px]">
            Onboarding Complete! 🎉
          </h3>
          <p className="text-[18px] mb-[35px] font-[Inter]">
            You can now trigger Journeys!
          </p>
          <Grid
            container
            direction={"row"}
            padding={"0px 0px"}
            marginBottom="20px"
          ></Grid>
          <div className="flex mt-[30px] justify-start">
            <GenericButton
              onClick={() => {
                handleNext();
              }}
              style={{
                maxWidth: "200px",
              }}
            >
              Create your first journey
            </GenericButton>
          </div>
        </div>
        <div className="bg-white rounded-3xl w-full max-w-[465px] max-h-[auto]">
          <div className="p-[20px] flex flex-col gap-[16px]">
            <h3 className="text-black font-[Poppins] text-[24px] font-bold">
              Your Setup List
            </h3>
            <p className="text-[#6B7280]">
              You're only a few steps away from your first message!
            </p>
          </div>
          <CustomStepper activeStep={3} />
        </div>
      </div>
    </div>
  );
}

export default Completion;
