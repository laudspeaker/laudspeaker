import TrashIcon from "assets/icons/TrashIcon";
import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import DateFormatPicker from "pages/PeopleImport/DateFormatPicker";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ActionType } from "reducers/auth.reducer";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Account, { UserPK } from "types/Account";
import * as uuid from "uuid";
import { setUserSchemaSetupped } from "reducers/onboarding.reducer";

//TODO: Shared NPM module with these types (Attribute, AttributeType, and AttributeParameter)
export interface Attribute {
  id?: string;
  name: string;
  attribute_type: AttributeType;
  attribute_subtype?: AttributeType;
  attribute_parameter?: AttributeParameter;
  is_primary?: boolean;
}

export interface AttributeParameter {
  id: number;
  key: string;
  display_value: string;
  attribute_type: AttributeType;
  example: string;
}

export interface AttributeType {
  id: number;
  name: string;
  can_be_subtype: boolean;
  subtype_required: boolean;
  parameters_required: boolean;
}

interface AttributeChanges {
  created: Attribute[];
  updated: Attribute[];
  deleted: Attribute[];
}

const PeopleSettings = () => {
  const [isPKLoading, setIsPKLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialPK, setInitialPK] = useState<Attribute>();
  const [newPK, setNewPK] = useState<Attribute>();
  const [initialAttributes, setInitialAttributes] = useState<Attribute[]>([]);
  const [possibleAttributes, setPossibleAttributes] = useState<Attribute[]>([]);
  const [possibleAttributeTypes, setPossibleAttributeTypes] = useState<
    AttributeType[]
  >([]);
  const [possibleAttributeParameters, setPossibleAttributeParameters] =
    useState<AttributeParameter[]>([]);

  const [createdAttributes, setCreatedAttributes] = useState<Attribute[]>([]);
  const [updatedAttributes, setUpdatedAttributes] = useState<Attribute[]>([]);
  const [deletedAttributes, setDeletedAttributes] = useState<Attribute[]>([]);
  const [attributeChanges, setAttributeChanges] = useState<AttributeChanges>({
    created: [],
    deleted: [],
    updated: [],
  });
  const [isDuplicationDetected, setIsDuplicationDetected] = useState(false);
  const [isAttributeKeysDefined, setIsAttributeKeysDefined] = useState(false);
  const [invalidJsonKeys, setInvalidJsonKeys] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Boolean&type=Date&type=DateTime`,
    });

    setPossibleAttributes(data);
    setInitialAttributes([...data]);
  };

  const loadKeyTypes = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attribute-types`,
    });

    setPossibleAttributeTypes(data);
  };

  const loadKeyParameters = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attribute-parameters/`,
    });

    const nonSystemAttributes = data.filter((item) => !item.isSystem);

    setPossibleAttributeParameters(nonSystemAttributes);
  };

  const loadPK = async () => {
    setIsPKLoading(true);

    try {
      const {
        data: { workspace },
      } = await ApiService.get<Account>({ url: "/accounts" });
      if (possibleAttributes.length)
        setInitialPK(
          possibleAttributes.filter((attribute) => {
            return attribute.is_primary;
          })[0]
        );

      setIsPKLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(`Couldn't load the primary key: ${JSON.stringify(error)}`);
      setIsPKLoading(false);
      navigate("/people");
    }
  };

  const handlePKChange = (nameAndTypeId: string) => {
    const [name, attributeTypeId] = nameAndTypeId.split(";;");

    setNewPK(
      possibleAttributes.filter((attribute) => {
        return (
          attribute.name?.toString() === name &&
          attribute.attribute_type.id.toString() === attributeTypeId
        );
      })[0]
    );
  };

  const handleSave = async () => {
    if (
      (!newPK &&
        [
          ...attributeChanges.created,
          ...attributeChanges.updated,
          ...attributeChanges.deleted,
        ].length === 0) ||
      isSaving ||
      isDuplicationDetected ||
      !isAttributeKeysDefined ||
      invalidJsonKeys.length > 0
    ) {
      return;
    }
    setIsSaving(true);

    if (
      [
        ...attributeChanges.created,
        ...attributeChanges.updated,
        ...attributeChanges.deleted,
      ].length > 0
    ) {
      try {
        await ApiService.post({
          url: "/customers/attributes/modify",
          options: attributeChanges,
        });
        toast.success("Attributes successfully modified!");
      } catch (e) {
        if (e instanceof AxiosError)
          toast.error(
            e.response?.data?.message ||
              "Unexpected error during attribute modification."
          );
        console.log(e);
      }
    }

    if (newPK) {
      try {
        await ApiService.put({
          url: "/customers/primary-key",
          options: {
            name: newPK.name,
            attribute_type: possibleAttributeTypes.filter((type) => {
              return type.id === newPK.attribute_type.id;
            })[0],
          },
        });
        const { data } = await ApiService.get<Account>({ url: "/accounts" });

        dispatch({
          type: ActionType.LOGIN_USER_SUCCESS,
          payload: {
            ...userData,
            pk: data.workspace.pk,
          },
        });

        toast.success("Primary Key Updated!");
        // Dispatch the action to update userSchemaSetupped
        dispatch(setUserSchemaSetupped(true));
      } catch (error) {
        if (error instanceof AxiosError)
          toast.error(
            error.response?.data?.message ||
              "Unexpected error during PK update."
          );
      }
    }

    setIsSaving(false);
    navigate("/people");
  };

  const isValidJsonKey = (key: string) => {
    // JSON key naming rules: must start with a letter, underscore, or dollar sign,
    // followed by letters, digits, underscores, or dollar signs
    const jsonKeyRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    return jsonKeyRegex.test(key);
  };

  useEffect(() => {
    loadKeyTypes();
    loadPossibleKeys();
    loadKeyParameters();
  }, []);

  useEffect(() => {
    loadPK();
  }, [possibleAttributes]);

  useEffect(() => {
    const changes: AttributeChanges = {
      created: createdAttributes.filter(
        (createdAttr) =>
          !initialAttributes
            .map((attr) => `${attr.name}:${attr.attribute_type}`)
            .includes(`${createdAttr.name}:${createdAttr.attribute_type}`)
      ),
      updated: updatedAttributes,
      deleted: deletedAttributes.filter(
        (deletedAttr) =>
          !createdAttributes
            .map(
              (createdAttr) =>
                `${createdAttr.name}:${createdAttr.attribute_type}`
            )
            .includes(`${deletedAttr.name}:${deletedAttr.attribute_type}`)
      ),
    };
    console.log(changes);
    setAttributeChanges(changes);
  }, [createdAttributes, updatedAttributes, deletedAttributes]);

  useEffect(() => {
    setIsDuplicationDetected(
      possibleAttributes.some(
        (attr1) =>
          possibleAttributes.filter(
            (attr2) =>
              attr1.name === attr2.name &&
              attr1.attribute_type === attr2.attribute_type
          ).length > 1
      )
    );
    setIsAttributeKeysDefined(possibleAttributes.every((attr) => !!attr.name));

    // Validate JSON key names
    const invalidKeys = possibleAttributes
      .filter((attr) => !isValidJsonKey(attr.name))
      .map((attr) => attr.name);
    setInvalidJsonKeys(invalidKeys);
  }, [possibleAttributes]);

  const handleTrackAttributeCreate = (attribute: Attribute) => {
    const newCreatedAttributes = [...createdAttributes];
    const newUpdatedAttributes = [...updatedAttributes];
    const newDeletedAttributes = [...deletedAttributes];

    console.log(newCreatedAttributes);

    const indexOfCreated = newCreatedAttributes
      .map((attr) => `${attr.name}:${JSON.stringify(attr.attribute_type)}`)
      .indexOf(`${attribute.name}:${attribute.attribute_type}`);
    if (indexOfCreated >= 0) {
      newCreatedAttributes.splice(indexOfCreated, 1);
    }

    const indexOfDeleted = newDeletedAttributes
      .map((attr) => `${attr.name}:${attr.attribute_type}`)
      .indexOf(`${attribute.name}:${attribute.attribute_type}`);
    if (indexOfDeleted >= 0) {
      newDeletedAttributes.splice(indexOfDeleted, 1);
    }

    const indexOfUpdated = newUpdatedAttributes
      .map((attr) => `${attr.name}:${attr.attribute_type}`)
      .indexOf(`${attribute.name}:${attribute.attribute_type}`);
    if (indexOfUpdated >= 0) {
      newUpdatedAttributes.splice(indexOfUpdated, 1);
    }

    newCreatedAttributes.push(attribute);

    setCreatedAttributes(newCreatedAttributes);
    setUpdatedAttributes(newUpdatedAttributes);
    setDeletedAttributes(newDeletedAttributes);
  };

  const handleTrackAttributeUpdate = (attribute: Attribute) => {
    const newCreatedAttributes = [...createdAttributes];
    const newUpdatedAttributes = [...updatedAttributes];
    const newDeletedAttributes = [...deletedAttributes];

    const indexOfCreated = newCreatedAttributes.indexOf(attribute);
    if (indexOfCreated >= 0) {
      setCreatedAttributes(newCreatedAttributes);
      setUpdatedAttributes(newUpdatedAttributes);
      setDeletedAttributes(newDeletedAttributes);

      return;
    }

    const indexOfUpdated = newUpdatedAttributes.indexOf(attribute);
    if (indexOfUpdated >= 0) {
      return;
    }

    const indexOfDeleted = newDeletedAttributes.indexOf(attribute);
    if (indexOfDeleted >= 0) {
      return;
    }

    newUpdatedAttributes.push(attribute);

    setCreatedAttributes(newCreatedAttributes);
    setUpdatedAttributes(newUpdatedAttributes);
    setDeletedAttributes(newDeletedAttributes);
  };

  const handleTrackAttributeDelete = (attribute: Attribute) => {
    const newCreatedAttributes = [...createdAttributes];
    const newUpdatedAttributes = [...updatedAttributes];
    const newDeletedAttributes = [...deletedAttributes];

    const indexOfCreated = newCreatedAttributes.indexOf(attribute);
    if (indexOfCreated >= 0) {
      newCreatedAttributes.splice(indexOfCreated, 1);
    }

    const indexOfUpdated = newUpdatedAttributes.indexOf(attribute);
    if (indexOfUpdated >= 0) {
      newUpdatedAttributes.splice(indexOfUpdated, 1);
    }

    const indexOfDeleted = newDeletedAttributes.indexOf(attribute);
    if (indexOfDeleted >= 0) {
      newDeletedAttributes.splice(indexOfDeleted, 1);
    }

    if (!uuid.validate(attribute.id || ""))
      newDeletedAttributes.push(attribute);

    setCreatedAttributes(newCreatedAttributes);
    setUpdatedAttributes(newUpdatedAttributes);
    setDeletedAttributes(newDeletedAttributes);
  };

  return (
    <div
      className={`font-inter font-normal text-[14px] text-[#111827] leading-[22px] ${
        isPKLoading && "pointer-events-none opacity-70 animate-pulse"
      }`}
    >
      <div className="w-full bg-white py-8 px-5 font-inter font-semibold text-[#111827] text-xl border-t border-b border-[#E5E7EB]">
        Schema Settings
      </div>
      <div className="w-full px-5 mt-4">
        <div className="flex flex-col w-full h-full bg-white py-5">
          <div className="w-full bg-white rounded">
            <div className="font-inter text-[16px] font-semibold leading-[24px] mb-[10px] px-5">
              Primary key
            </div>
            <Select
              className="px-5"
              placeholder={
                (search && (newPK || initialPK)?.name) ||
                "Select which customer attribute to use as the primary key"
              }
              searchValue={search}
              onSearchValueChange={setSearch}
              searchPlaceholder="Search attribute by name"
              id="attribute-search"
              value={
                initialPK || newPK
                  ? `${(newPK || initialPK)?.name};;${
                      (newPK || initialPK)?.attribute_type.id
                    }`
                  : ""
              }
              options={possibleAttributes
                .filter(
                  (el) =>
                    el.name.includes(search) &&
                    el.attribute_type.subtype_required === false
                )
                .map((el) => ({
                  key: `${el.name};;${el.attribute_type.id}`,
                  title: el.name,
                }))}
              onChange={handlePKChange}
            />
            <hr className="border-[#E5E7EB] my-5" />
            <div className="px-5 flex flex-col gap-2.5">
              <div className="font-inter text-[16px] font-semibold leading-[24px]">
                User attributes
              </div>

              {possibleAttributes.map((attr, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#F3F4F6] flex items-center justify-between gap-5"
                >
                  <div className="flex items-center gap-2.5">
                    <Input
                      value={attr.name}
                      onChange={(value) => {
                        if (
                          initialPK &&
                          initialPK.name === possibleAttributes[i].name
                        ) {
                          initialPK.name = value;
                        }
                        possibleAttributes[i].name = value;
                        handleTrackAttributeUpdate(possibleAttributes[i]);
                        setPossibleAttributes([...possibleAttributes]);
                      }}
                    />
                    <Select
                      className="!w-[200px]"
                      buttonClassName="!w-[200px]"
                      value={attr.attribute_type.name}
                      onChange={(type) => {
                        possibleAttributes[i].attribute_type =
                          possibleAttributeTypes.find((possibleType) => {
                            return possibleType.name === type;
                          }) || possibleAttributeTypes[0];
                        handleTrackAttributeUpdate(possibleAttributes[i]);
                        setPossibleAttributes([...possibleAttributes]);
                      }}
                      options={Object.values(possibleAttributeTypes).map(
                        (type) => ({ key: type.name, title: type.name })
                      )}
                      disabled={!!attr.id}
                    />
                    {attr.attribute_type.subtype_required && (
                      <Select
                        className="!w-[200px]"
                        buttonClassName="!w-[200px]"
                        value={
                          attr.attribute_subtype
                            ? attr.attribute_subtype?.name
                            : possibleAttributeTypes.filter(
                                (possibleType) =>
                                  possibleType.can_be_subtype === true
                              )[0].name
                        }
                        onChange={(type) => {
                          possibleAttributes[i].attribute_subtype =
                            possibleAttributeTypes
                              .filter(
                                (possibleType) =>
                                  possibleType.can_be_subtype === true
                              )
                              .find((possibleType) => {
                                return possibleType.name === type;
                              }) ||
                            possibleAttributeTypes.filter(
                              (possibleType) =>
                                possibleType.can_be_subtype === true
                            )[0];
                          handleTrackAttributeUpdate(possibleAttributes[i]);
                          setPossibleAttributes([...possibleAttributes]);
                        }}
                        options={Object.values(possibleAttributeTypes)
                          .filter((type) => type.can_be_subtype === true)
                          .map((type) => ({
                            key: type.name,
                            title: type.name,
                          }))}
                        disabled={!!attr.id}
                      />
                    )}
                    {(attr.attribute_type.parameters_required ||
                      attr.attribute_subtype?.parameters_required) && (
                      <DateFormatPicker
                        type={
                          attr.attribute_parameter?.attribute_type.name ===
                          StatementValueType.DATE
                            ? StatementValueType.DATE
                            : StatementValueType.DATE_TIME
                        }
                        value={
                          attr.attribute_parameter?.display_value ||
                          possibleAttributeParameters[0].display_value
                        }
                        onChange={(dateFormat) => {
                          // possibleAttributes[i].dateFormat = dateFormat;
                          handleTrackAttributeUpdate(possibleAttributes[i]);
                          setPossibleAttributes([...possibleAttributes]);
                        }}
                        disabled={!!attr.id}
                      />
                    )}
                  </div>
                  {possibleAttributes.filter(
                    (attr2) =>
                      attr2.name === attr.name &&
                      attr2.attribute_type.id === attr.attribute_type.id
                  ).length > 1 && (
                    <div className="text-red-500">
                      Attribute duplication is not allowed!
                    </div>
                  )}

                  {!attr.name && (
                    <div className="text-red-500">
                      Attribute key must be defined!
                    </div>
                  )}

                  {!isValidJsonKey(attr.name) && (
                    <div className="text-red-500">
                      Invalid key name; keys must adhere to JSON key naming
                      rules. See{" "}
                      <a
                        href="https://docs.n8n.io/reference/json-key-names"
                        className="text-blue-500"
                      >
                        here
                      </a>{" "}
                      for more information.
                    </div>
                  )}

                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      handleTrackAttributeDelete(possibleAttributes[i]);
                      possibleAttributes.splice(i, 1);
                      setPossibleAttributes([...possibleAttributes]);
                    }}
                  >
                    <TrashIcon />
                  </div>
                </div>
              ))}

              <Button
                type={ButtonType.SECONDARY}
                onClick={() => {
                  const newAttribute: Attribute = {
                    name: "",
                    attribute_type: possibleAttributeTypes[0],
                  };
                  setPossibleAttributes([...possibleAttributes, newAttribute]);
                  handleTrackAttributeCreate(newAttribute);
                }}
                className="!border-[#E5E7EB] !text-[#111827] !w-fit"
              >
                Add attribute
              </Button>
            </div>
            <hr className="border-[#E5E7EB] my-5" />
            <div className="flex gap-[10px] px-5">
              <Button
                type={ButtonType.PRIMARY}
                disabled={
                  (!newPK &&
                    [
                      ...attributeChanges.created,
                      ...attributeChanges.updated,
                      ...attributeChanges.deleted,
                    ].length === 0) ||
                  isSaving ||
                  isDuplicationDetected ||
                  !isAttributeKeysDefined ||
                  invalidJsonKeys.length > 0
                }
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                type={ButtonType.SECONDARY}
                onClick={() => {
                  navigate("/people");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleSettings;
