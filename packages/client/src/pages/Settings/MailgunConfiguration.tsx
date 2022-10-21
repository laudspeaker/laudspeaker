import { FormControl, Grid } from "@mui/material";
import Header from "components/Header";
import { Input, Select, GenericButton } from "components/Elements";
import CustomStepper from "./components/CustomStepper";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "hooks/useTypeSelector";
import {
  setSettingData,
  setSettingsPrivateApiKey,
  setDomainsList,
} from "reducers/settings";

function MailgunConfiguration() {
  const { settings, domainsList } = useTypedSelector((state) => state.settings);

  const [domainName, setDomainName] = useState<any>(settings.domainName || "");
  const [privateApiKey, setPrivateApiKey] = useState<string>(
    settings.privateApiKey || ""
  );
  const [domainList, setDomainList] = useState<any>(domainsList || []);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleInputChange = (name: any, value: any): any => {
    dispatch(setSettingData({ ...settings, [name]: value }));
  };
  const moveToAdditionalSettings = () => {
    navigate("/settings/mailgun-configuration-two");
  };
  const callDomains = async () => {
    if (privateApiKey) {
      dispatch(setSettingsPrivateApiKey(privateApiKey));
      const response = await dispatch(setDomainsList(privateApiKey));
      if (response?.data) {
        setDomainList(response?.data);
      }
    }
  };
  return (
    <div className="w-full relative flex flex-col h-screen font-[Inter] bg-[#E5E5E5]">
      <Header />
      <div className="flex justify-around m-[72px_50px_72px_50px] gap-[30px]">
        <div className="bg-white rounded-3xl p-[30px] w-full max-w-[930px]">
          <h3 className="flex items-center gap-[10px] text-[25px] font-semibold leading-[40px] mb-[10px]">
            Email Configuration
          </h3>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Input
                isRequired
                value={privateApiKey}
                label="Private API Key"
                placeholder={"****  "}
                name="name"
                id="name"
                type="password"
                style={{
                  maxWidth: "530px",
                  padding: "15px 16px 15px 16px",
                  background: "#fff",
                  border: "1px solid #D1D5DB",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: "16px",
                }}
                labelClass="!text-[16px]"
                onChange={(e) => {
                  setPrivateApiKey(e.target.value);
                  handleInputChange("privateApiKey", e.target.value);
                }}
                onBlur={callDomains}
              />
            </FormControl>
          </Grid>
          <p className="text-[16px] mb-[10px]">Domain</p>
          <Grid container direction={"row"} padding={"10px 0px"}>
            <FormControl variant="standard">
              <Select
                id="activeJourney"
                value={domainName}
                options={domainList.map((item: any) => ({
                  value: item.name,
                }))}
                onChange={(value) => {
                  setDomainName(value);
                  handleInputChange("domainName", value);
                }}
                displayEmpty
                renderValue={(val: any) => val}
                sx={{
                  height: "44px",
                  margin: "20px 0px",
                }}
                inputProps={{
                  "& .MuiSelect-select": {
                    padding: "9px 15px",
                    border: "1px solid #DEDEDE",
                    boxShadow: "none",
                    borderRadius: "3px",
                  },
                  sx: {
                    borderRadius: "6px !important",
                  },
                }}
              />
              {/* {domainList.map((channel: any) => {
                  return (
                    <MenuItem
                      value={channel.name}
                      disabled={!channel?.state}
                      sx={{
                        height: "auto",
                        "&.Mui-selected": {
                          background: "transparent",
                        },
                        "&.Mui-selected:hover": {
                          background: "transparent",
                        },
                        "&:hover": {
                          background: "transparent",
                        },
                      }}
                    >
                      <ListItem
                        title={channel.name}
                        subtitle={`${channel.type} ${
                          !channel.state ? "(coming soon)" : ""
                        }`}
                      />
                    </MenuItem>
                  );
                })}
              </Select> */}
            </FormControl>
          </Grid>
          <div className="flex mt-[50px] justify-start">
            <GenericButton
              onClick={moveToAdditionalSettings}
              disabled={!privateApiKey || !domainName}
              style={{
                maxWidth: "200px",
              }}
            >
              Next
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
          <CustomStepper activeStep={1} />
        </div>
      </div>
    </div>
  );
}

export default MailgunConfiguration;
