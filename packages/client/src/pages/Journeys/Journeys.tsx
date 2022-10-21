import React, { useState } from "react";
import ShowTable from "../../components/ShowTable";
import { GenericButton, Input } from "components/Elements";

const Journeys = () => {
  const addJourney = () => {};
  const [email, setEmail] = useState("");
  return (
    <div className="p-[0px_20px]">
      <div className="flex justify-between items-center p-[25px_0px]">
        <div>
          <h3 className="flex items-center text-[25px] font-semibold leading-[40px] mb-[10px]">
            Journeys
          </h3>
        </div>
        <div className="flex">
          <GenericButton
            onClick={addJourney}
            style={{
              height: "50px",
              boxShadow: "0px 8px 16px -6px rgba(0, 0, 0, 0.1)",
              fontSize: "16px",
              fontWeight: 500,
              padding: "10px 20px",
              width: "150px",
              lineHeight: "25px",
            }}
          >
            Add Journeys
          </GenericButton>
          <GenericButton
            onClick={addJourney}
            style={{
              height: "50px",
              background: "#FFF",
              fontSize: "14px",
              fontWeight: 500,
              padding: "10px 20px",
              width: "150px",
              lineHeight: "30px",
              color: "#223343",
            }}
          >
            Next
          </GenericButton>
        </div>
      </div>

      <div className="flex items-center mb-[140px]">
        <div>
          <p className="flex items-center text-[16px] font-normal leading-[30px] text-[#223343] m-[0px_10px]">
            Filter for journeys by
          </p>
        </div>
        <div>
          <Input
            value={email}
            placeholder={"Email Address"}
            name="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            // onKeyDown={handleTitleEnter}
            autoFocus
            inputProps={{
              style: {
                padding: "10px",
                height: "44px",
                background: "#E5E5E5",
                fontWeight: "400",
                fontSize: "16px",
                color: "#6B7280",
                borderRadius: "10px",
              },
            }}
          />
        </div>
      </div>
      <ShowTable />
    </div>
  );
};

export default Journeys;
