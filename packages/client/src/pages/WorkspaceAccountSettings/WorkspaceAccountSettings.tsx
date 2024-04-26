import { AxiosError } from "axios";
import { GenericButton } from "components/Elements";
import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Modal from "components/Elements/Modalv2";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import Account from "types/Account";

const accountPropertiesToCheck: (keyof Account)[] = [
  "email",
  "firstName",
  "lastName",
];

const WorkspaceAccountSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialAccount, setInitialAccount] = useState<Account>();
  const [account, setAccount] = useState<Account>();
  const [isAccountChanged, setIsAccountChanged] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyNewPassword, setVerifyNewPassword] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState("");

  const loadAccount = async () => {
    setIsLoading(true);
    try {
      const { data } = await ApiService.get<Account>({ url: "/accounts" });

      setAccount(data);
      setInitialAccount(data);
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(
          e.response?.data?.message ||
            "Unexpected error while loading account data"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    setIsAccountChanged(
      accountPropertiesToCheck.some(
        (key) => account?.[key] !== initialAccount?.[key]
      )
    );
  }, [account]);

  if (!account || !initialAccount) return <></>;

  const handleSave = async () => {
    await ApiService.patch({
      url: "/accounts",
      options: {
        ...account,
      },
    });
    await loadAccount();
  };

  const handleChangePassword = async () => {
    await ApiService.patch({
      url: "/accounts",
      options: {
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        verifyNewPassword: verifyNewPassword || undefined,
      },
    });
    await loadAccount();
  };

  const handleCancel = async () => {
    await loadAccount();
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await ApiService.delete({
        url: "/accounts",
        options: { data: { password: passwordToDelete } },
      });
      window.location.reload();
    } catch (e) {
      let message = "Unexpected error";
      if (e instanceof AxiosError)
        message = e.response?.data.message || message;

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center p-5 font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="max-w-[970px] w-full flex flex-col gap-5">
        <div className="font-semibold text-[20px] leading-[28px]">Account</div>
        <div className="bg-white rounded p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 border-b border-[#E5E7EB] pb-5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Profile
            </div>
            <div className="flex items-center gap-5">
              <div className="flex flex-col gap-[5px] w-full">
                <div>First name</div>
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value={account.firstName || ""}
                  onChange={(value) =>
                    setAccount({ ...account, firstName: value })
                  }
                />
              </div>
              <div className="flex flex-col gap-[5px] w-full">
                <div>Last name</div>
                <Input
                  wrapperClassName="!w-full"
                  className="!w-full"
                  value={account.lastName || ""}
                  onChange={(value) =>
                    setAccount({ ...account, lastName: value })
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-[5px] w-full">
              <div>Email</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value={account.email}
                onChange={(value) => setAccount({ ...account, email: value })}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                type={ButtonType.PRIMARY}
                onClick={handleSave}
                disabled={isLoading || !isAccountChanged}
              >
                Save
              </Button>
              <Button
                type={ButtonType.SECONDARY}
                onClick={handleCancel}
                disabled={isLoading || !isAccountChanged}
              >
                Cancel
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 border-b border-[#E5E7EB] pb-5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Password
            </div>
            <div className="flex flex-col gap-[5px] w-full">
              <div>Current password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value={currentPassword}
                onChange={setCurrentPassword}
                type="password"
              />
            </div>

            <div className="flex flex-col gap-[5px] w-full">
              <div>New password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
              />
            </div>

            <div className="flex flex-col gap-[5px] w-full">
              <div>Confirm new password</div>
              <Input
                wrapperClassName="!w-full"
                className="!w-full"
                value={verifyNewPassword}
                onChange={setVerifyNewPassword}
                type="password"
              />
            </div>

            <Button
              className="!w-fit"
              type={ButtonType.PRIMARY}
              onClick={handleChangePassword}
              disabled={
                isLoading ||
                !currentPassword ||
                !newPassword ||
                newPassword !== verifyNewPassword
              }
            >
              Change password
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-[16px] leading-[24px]">
              Delete account
            </div>

            <Button
              className="!w-fit"
              type={ButtonType.DANGEROUS}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="flex flex-col gap-[10px] font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
          <div>To delete your account please enter password:</div>
          <Input
            name="password"
            type="password"
            value={passwordToDelete}
            onChange={(value) => setPasswordToDelete(value)}
            id="delete-account-modal-password-input"
          />
          <div>
            <Button type={ButtonType.DANGEROUS} onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceAccountSettings;
