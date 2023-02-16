import { RadioGroup } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Input } from "components/Elements";
import React, { ChangeEvent, FC, useEffect, useState } from "react";
import { DatabaseStepProps } from "../Database";

export enum DBType {
  DATABRICKS = "databricks",
  POSTGRESQL = "postgresql",
}

const memoryOptions: Record<
  string,
  { id: DBType; name: string; inStock: boolean }
> = {
  databricks: {
    id: DBType.DATABRICKS,
    name: "Databricks",
    inStock: true,
  },
  postgresql: {
    id: DBType.POSTGRESQL,
    name: "PostgreSQL",
    inStock: true,
  },
  // mysql: { id: "mysql", name: "MySQL", inStock: false },
  // sqlServer: { id: "sqlServer", name: "SQL Server", inStock: false },
};

const protocols: Record<string, string> = {
  databricks: "",
  postgresql: "postgresql://",
  // mysql: "mysqlx://",
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const DatabaseStep3: FC<DatabaseStepProps> = ({
  formData,
  setFormData,
  errors,
  showErrors,
  handleShowErrors,
}) => {
  const dbType = formData.dbType;
  const mem = memoryOptions[dbType];

  const [connectionData, setConnectionData] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
  });
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (!isFirstRender)
      setFormData({
        ...formData,
        connectionString: `${protocols[mem.id]}${connectionData.username}${
          connectionData.password && connectionData.username
            ? `:${connectionData.password}`
            : ""
        }${connectionData.username ? "@" : ""}${connectionData.host}${
          connectionData.port ? `:${connectionData.port}` : ""
        }${connectionData.database ? `/${connectionData.database}` : ""}`,
      });
  }, [connectionData]);

  useEffect(() => {
    const atParts = formData.connectionString.split("@", 2);

    if (atParts.length === 2) {
      const [username, password] = atParts[0]
        .replace(protocols[mem.id], "")
        .split(":", 2);
      const [hostAndPort, database] = atParts[1].split("/", 2);
      const [host, port] = hostAndPort.split(":", 2);

      setConnectionData({ host, port, username, password, database });
    } else {
      const [hostAndPort, database] = formData.connectionString
        .replace(protocols[mem.id], "")
        .split("/", 2);
      const [host, port] = hostAndPort.split(":", 2);

      setConnectionData({
        host,
        port,
        username: "",
        password: "",
        database: database || "",
      });
    }

    setIsFirstRender(false);
  }, []);

  const handleConnectionData = (e: ChangeEvent<HTMLInputElement>) => {
    setConnectionData({ ...connectionData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div className="space-y-1">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Select Your Database Type
        </h3>
      </div>
      <div className="space-y-10 mb-[10px]">
        <RadioGroup
          value={mem}
          onChange={(m) =>
            setFormData({
              ...formData,
              dbType: m.id,
              connectionString: protocols[m.id],
            })
          }
          className="mt-2"
        >
          <RadioGroup.Label className="sr-only">
            Choose a memory option
          </RadioGroup.Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {Object.values(memoryOptions).map((option) => (
              <RadioGroup.Option
                key={option.name}
                value={option}
                className={({ active, checked }) =>
                  classNames(
                    option.inStock
                      ? "cursor-pointer focus:outline-none"
                      : "opacity-25 cursor-not-allowed",
                    active ? "ring-2 ring-offset-2 ring-cyan-500" : "",
                    checked
                      ? "bg-cyan-600 border-transparent text-white hover:bg-cyan-700"
                      : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                    "border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium sm:flex-1"
                  )
                }
                disabled={!option.inStock}
              >
                <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
      {dbType &&
        (dbType === DBType.DATABRICKS ? (
          <div className="mt-[20px] flex flex-col gap-[10px]">
            <b>Params separeted</b>
            <div>
              <dd className="relative">
                <Input
                  value={formData.databricksData.host}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      databricksData: {
                        ...formData.databricksData,
                        host: e.target.value,
                      },
                    })
                  }
                  onBlur={() => handleShowErrors("databricksData")}
                  className={classNames(
                    errors.databricksData.length > 0 &&
                      showErrors.databricksData
                      ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                      : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                  )}
                  name="host"
                  id="host"
                  placeholder="host"
                  label="Host"
                />
                {errors.databricksData.length > 0 && showErrors.databricksData && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dd className="relative">
                <Input
                  value={formData.databricksData.path}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      databricksData: {
                        ...formData.databricksData,
                        path: e.target.value,
                      },
                    })
                  }
                  onBlur={() => handleShowErrors("databricksData")}
                  className={classNames(
                    errors.databricksData.length > 0 &&
                      showErrors.databricksData
                      ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                      : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                  )}
                  name="httpPath"
                  id="httpPath"
                  placeholder="http path"
                  label="Http path"
                />
                {errors.databricksData.length > 0 && showErrors.databricksData && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </dd>
            </div>
            <div>
              <dd className="relative">
                <Input
                  value={formData.databricksData.token}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      databricksData: {
                        ...formData.databricksData,
                        token: e.target.value,
                      },
                    });
                    handleShowErrors("databricksData");
                  }}
                  onBlur={() => handleShowErrors("databricksData")}
                  type="password"
                  className={classNames(
                    errors.databricksData.length > 0 &&
                      showErrors.databricksData
                      ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                      : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                  )}
                  id="token"
                  name="token"
                  placeholder="token"
                  label="Token"
                />
                {errors.databricksData.length > 0 && showErrors.databricksData && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </dd>
            </div>
            {showErrors.databricksData &&
              errors.databricksData.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </div>
        ) : (
          <div>
            <div>
              <b>Connection string</b>
              <div className="relative">
                <Input
                  value={formData.connectionString}
                  name="connectionString"
                  id="connectionString"
                  disabled
                />
              </div>
            </div>
            <div className="mt-[20px] flex flex-col gap-[10px]">
              <b>Params separeted</b>
              <div className="flex justify-between items-center gap-[20px]">
                <Input
                  id="host"
                  name="host"
                  placeholder="host"
                  wrapperClasses="flex-[3]"
                  label="Host"
                  value={connectionData.host}
                  onChange={handleConnectionData}
                />
                <Input
                  id="port"
                  name="port"
                  type="number"
                  placeholder="port"
                  wrapperClasses="flex-[1]"
                  label="Port"
                  value={connectionData.port}
                  onChange={handleConnectionData}
                />
              </div>
              <Input
                id="username"
                name="username"
                placeholder="username"
                label="Username"
                value={connectionData.username}
                onChange={handleConnectionData}
              />
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="password"
                label="Password"
                value={connectionData.password}
                onChange={handleConnectionData}
              />
              <Input
                id="database"
                name="database"
                placeholder="database"
                label="Database"
                value={connectionData.database}
                onChange={handleConnectionData}
              />
            </div>
          </div>
        ))}
    </div>
  );
};

export default DatabaseStep3;
