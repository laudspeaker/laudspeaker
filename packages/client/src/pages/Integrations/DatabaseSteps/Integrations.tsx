import Header from "components/Header";
import React, { useState, useEffect } from "react";
import ApiService from "services/api.service";
import { DatabaseFormData } from "../Database";
import { Link } from "react-router-dom";

const Integrations = () => {
  const [integrations, setIntegrations] = useState<
    (DatabaseFormData & { id: string })[]
  >([]);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get<
        (DatabaseFormData & {
          databricksHost?: string;
          databricksPath?: string;
          databricksToken?: string;
          id: string;
        })[]
      >({
        url: "/integrations/db",
      });
      setIntegrations(
        data?.map((item) => ({
          ...item,
          databricksData: {
            host: item.databricksHost,
            path: item.databricksPath,
            token: item.databricksToken,
          },
        })) || []
      );
    })();
  }, []);

  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col">
          <Header />
          <main>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Integrations
                  </h1>
                  <div className="py-6">
                    {integrations.map((item) => (
                      <Link to={"/integrations/db/" + item.id}>
                        <div className="border-b-[1px] border-gray-400">
                          <h3>{item.name}</h3>
                          <p className="text-gray-400 text-[14px]">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
