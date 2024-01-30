import TrashIcon from "assets/icons/TrashIcon";
import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import DateFormatPicker from "pages/PeopleImport/DateFormatPicker";
import { AttributeType } from "pages/PeopleImport/PeopleImport";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ActionType } from "reducers/auth.reducer";
import { StatementValueType } from "reducers/flow-builder.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Account, { UserPK } from "types/Account";

export interface Attribute {
  // id: string;
  key: string;
  type: AttributeType;
  dateFormat?: string;
  isArray: false;
}

const PeopleSettings = () => {
  const [isPKLoading, setIsPKLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pk, setPK] = useState<UserPK>();
  const [newPK, setNewPK] = useState<{ key: string; type: AttributeType }>();
  const [initialAttributes, setInitialAttributes] = useState<Attribute[]>([]);
  const [possibleAttributes, setPossibleAttributes] = useState<Attribute[]>([]);

  const [createdAttributes, setCreatedAttributes] = useState<Attribute[]>([]);
  const [updatedAttributes, setUpdatedAttributes] = useState<Attribute[]>([]);
  const [deletedAttributes, setDeletedAttributes] = useState<Attribute[]>([]);

  (() => {
    const changes = {
      created: createdAttributes.filter(
        (createdAttr) =>
          !initialAttributes
            .map((attr) => `${attr.key}:${attr.type}`)
            .includes(`${createdAttr.key}:${createdAttr.type}`)
      ),
      updated: updatedAttributes,
      deleted: deletedAttributes.filter(
        (deletedAttr) =>
          !createdAttributes
            .map((createdAttr) => `${createdAttr.key}:${createdAttr.type}`)
            .includes(`${deletedAttr.key}:${deletedAttr.type}`)
      ),
    };
    console.log(changes);
  })();

  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Date&type=DateTime&isArray=false`,
    });

    setPossibleAttributes(data);
    setInitialAttributes([...data]);
  };

  const loadPK = async () => {
    setIsPKLoading(true);

    try {
      const {
        data: { workspace },
      } = await ApiService.get<Account>({ url: "/accounts" });
      setPK(workspace?.pk);

      setIsPKLoading(false);
    } catch (error) {
      toast.error("Error loading user data");
      navigate("/people");
    }
  };

  const handlePKChange = (value: string) => {
    const [key, type] = value.split(";;");
    if (!key || !type) return;

    setNewPK({
      key,
      type: type as AttributeType,
    });
  };

  const handleSave = async () => {
    if (!newPK || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await ApiService.put({
        url: "/customers/primary-key",
        options: {
          ...newPK,
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
      navigate("/people");
    } catch (error) {
      if (error instanceof AxiosError)
        toast.error(
          error.response?.data?.message || "Unexpected error during PK update."
        );
    }
    setIsSaving(false);
  };

  useEffect(() => {
    loadPK();
    loadPossibleKeys();
  }, []);

  const handleTrackAttributeCreate = (attribute: Attribute) => {
    const newCreatedAttributes = [...createdAttributes];
    const newUpdatedAttributes = [...updatedAttributes];
    const newDeletedAttributes = [...deletedAttributes];

    const indexOfCreated = newCreatedAttributes
      .map((attr) => `${attr.key}:${attr.type}`)
      .indexOf(`${attribute.key}:${attribute.type}`);
    if (indexOfCreated >= 0) {
      newCreatedAttributes.splice(indexOfCreated, 1);
    }

    const indexOfDeleted = newDeletedAttributes
      .map((attr) => `${attr.key}:${attr.type}`)
      .indexOf(`${attribute.key}:${attribute.type}`);
    if (indexOfDeleted >= 0) {
      newDeletedAttributes.splice(indexOfDeleted, 1);
    }

    const indexOfUpdated = newUpdatedAttributes
      .map((attr) => `${attr.key}:${attr.type}`)
      .indexOf(`${attribute.key}:${attribute.type}`);
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
        Setting
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
                (search && (newPK || pk)?.key) || "Select user attribute as PK"
              }
              searchValue={search}
              onSearchValueChange={setSearch}
              searchPlaceholder="Search attribute by name"
              value={
                pk || newPK
                  ? `${(newPK || pk)?.key};;${(newPK || pk)?.type}`
                  : ""
              }
              options={possibleAttributes
                .filter((el) => el.key.includes(search))
                .map((el) => ({
                  key: `${el.key};;${el.type}`,
                  title: el.key,
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
                      value={attr.key}
                      onChange={(value) => {
                        if (pk && pk.key === possibleAttributes[i].key) {
                          pk.key = value;
                        }
                        possibleAttributes[i].key = value;
                        handleTrackAttributeUpdate(possibleAttributes[i]);
                        setPossibleAttributes([...possibleAttributes]);
                      }}
                    />
                    <Select
                      className="!w-[200px]"
                      buttonClassName="!w-[200px]"
                      value={attr.type}
                      onChange={(type) => {
                        possibleAttributes[i].type = type;
                        handleTrackAttributeUpdate(possibleAttributes[i]);
                        setPossibleAttributes([...possibleAttributes]);
                      }}
                      options={Object.values(StatementValueType).map(
                        (type) => ({ key: type, title: type })
                      )}
                    />
                    {(attr.type === StatementValueType.DATE ||
                      attr.type === StatementValueType.DATE_TIME) && (
                      <DateFormatPicker
                        type={attr.type}
                        value={attr.dateFormat || ""}
                        onChange={(dateFormat) => {
                          possibleAttributes[i].dateFormat = dateFormat;
                          handleTrackAttributeUpdate(possibleAttributes[i]);
                          setPossibleAttributes([...possibleAttributes]);
                        }}
                      />
                    )}
                  </div>
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
                    key: "",
                    type: StatementValueType.STRING,
                    isArray: false,
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
                disabled={!newPK || isSaving}
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
