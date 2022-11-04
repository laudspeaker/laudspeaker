import Card from "components/Cards/Card";
import { GenericButton } from "components/Elements";
import Header from "components/Header";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";

const Person = () => {
  const { id } = useParams();
  const [personInfo, setPersonInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/customers/" + id });
      setPersonInfo(data);
    })();
  });
  return (
    <div className="w-full min-h-screen">
      <Header />
      <div className="p-[30px_50px]">
        <div className="flex justify-between items-center">
          <div className="">
            <h3 className="text-[32px]">Ricardo Cooper</h3>
            <h6>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore
              suscipit
            </h6>
          </div>
          <div className="flex h-[50px] gap-[10px]">
            <GenericButton onClick={() => {}}>Edit</GenericButton>
            <GenericButton onClick={() => {}}>Delete</GenericButton>
          </div>
        </div>
        <div className="flex gap-[30px]">
          <Card className="flex-[3] p-[10px]">1</Card>
          <Card className="flex-[1] p-[10px]">2</Card>
        </div>
      </div>
    </div>
  );
};

export default Person;
