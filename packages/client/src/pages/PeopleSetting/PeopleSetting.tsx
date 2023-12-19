import { AxiosError } from "axios";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Select from "components/Elements/Selectv2";
import { AttributeType } from "pages/PeopleImport/PeopleImport";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ActionType } from "reducers/auth.reducer";
import ApiService from "services/api.service";
import { useAppSelector } from "store/hooks";
import Account, { UserPK } from "types/Account";

const PeopleSetting = () => {
  const [isPKLoading, setIsPKLoading] = useState(true);
  const [isPKSaving, setIsPKSaving] = useState(false);
  const [pk, setPK] = useState<UserPK>();
  const [newPK, setNewPK] = useState<{ key: string; type: AttributeType }>();
  const [possibleAttributes, setPossibleAttributes] = useState<
    {
      key: string;
      type: AttributeType;
      isArray: false;
    }[]
  >([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const { userData } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const loadPossibleKeys = async () => {
    const { data } = await ApiService.get<any[]>({
      url: `/customers/possible-attributes?removeLimit=true&type=String&type=Number&type=Email&type=Date&isArray=false`,
    });

    setPossibleAttributes(data);
  };

  const loadPK = async () => {
    setIsPKLoading(true);

    try {
      const {
        data: { pk: primaryKey },
      } = await ApiService.get<Account>({ url: "/accounts" });
      setPK(primaryKey);

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
    if (!newPK || isPKSaving) {
      return;
    }
    setIsPKSaving(true);
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
          pk: data.pk,
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
    setIsPKSaving(false);
  };

  useEffect(() => {
    loadPK();
    loadPossibleKeys();
  }, []);

  return (
    <div
      className={`${
        isPKLoading && "pointer-events-none opacity-70 animate-pulse"
      }`}
    >
      <div className="w-full bg-white py-8 px-5 font-inter font-semibold text-[#111827] text-xl border-t border-b border-[#E5E7EB]">
        Setting
      </div>
      <div className="w-full px-5 mt-4">
        <div className="flex flex-col w-full h-full bg-white py-5">
          <div className="w-full bg-white rounded">
            <div className="text-[#111827] font-inter text-sm mb-[10px] px-5">
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
            <div className="flex gap-[10px] px-5">
              <Button
                type={ButtonType.PRIMARY}
                disabled={!newPK || isPKSaving}
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

export default PeopleSetting;
