import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import { Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSettingData } from "reducers/settings";
import { useTypedSelector } from "hooks/useTypeSelector";
import Chip from "components/Elements/Chip";

export const allEmailChannels = [
  {
    id: "free3",
    title: "Free 3 emails",
    subTitle: "Campaign: Onboarding Campaign",
    tooltip: "",
    disabled: false,
  },
  {
    id: "mailgun",
    title: "Mailgun",
    subTitle: "Campaign: Onboarding Campaign",
    tooltip: "",
    disabled: false,
  },
  {
    id: "sendgrid",
    title: "Sendgrid",
    subTitle: "for any campaign or newsletter",
    tooltip: "",
    disabled: false,
  },
  {
    id: "mailchimp",
    title: "Mailchimp",
    subTitle: "Campaign: Transactional Receipt",
    tooltip: "",
    disabled: true,
  },
  {
    id: "smtp",
    title: "SMTP",
    subTitle: "Setup your own email server",
    tooltip: "",
    disabled: true,
  },
];

function EmailProvider() {
  const dispatch = useDispatch();
  const { settings } = useTypedSelector((state) => state.settings);
  const [eventProvider, setEventProvider] = useState<any>(
    settings.eventProvider || []
  );
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const navigate = useNavigate();
  const moveToMailgunConfiguration = () => {
    navigate("/settings/mailgun-configuration");
  };
  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px] !overflow-visible">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Email configuration
          </h3>
          <p className="text-[18px] mb-[10px]">
            Search for your email provider
          </p>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={eventProvider}
                options={allEmailChannels.map((item: any) => ({
                  title: item.title,
                  subtitle: item.subTitle,
                  value: item.id,
                  disabled: item.disabled,
                }))}
                displayEmpty
                onChange={(value) => {
                  setEventProvider(value);
                  handleInputChange("eventProvider", value);
                }}
                multipleSelections={true}
                renderValue={(selected) => <>{selected.join(", ")}</>}
                sx={{
                  height: "44px",
                  margin: "20px 0px",
                }}
                inputProps={{
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    boxShadow: "none",
                  },
                  sx: {
                    borderRadius: "6px !important",
                  },
                }}
              />
            </FormControl>
          </Grid>
          <Grid
            container
            direction={"row"}
            padding={"0px 0px"}
            marginBottom="20px"
          >
            {eventProvider.map((events: any) => {
              return (
                <div className="flex flex-wrap mr-[20px]">
                  <Chip key={events} label={events} />
                </div>
              );
            })}
          </Grid>
          <div className="flex mt-[40px] justify-start">
            <GenericButton
              onClick={moveToMailgunConfiguration}
              style={{
                maxWidth: "200px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Next
            </GenericButton>
          </div>
        </div>
        <div className="bg-white rounded-3xl w-full max-w-[465px] max-h-[auto]">
          <div className="flex p-[20px] flex-col gap-[16px]">
            <h3 className="text-black">Your Setup List</h3>
            <p className="text-[#6B7280]">
              Get your account ready to send automated message that people like
              to receive.
            </p>
          </div>
          <CustomStepper activeStep={0} />
        </div>
      </div>
    </div>
  );
}

export default EmailProvider;
