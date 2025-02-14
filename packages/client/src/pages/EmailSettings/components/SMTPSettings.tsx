import Input from "components/Elements/Inputv2";
import { Checkbox } from "components/Elements";
import { FC, useState } from "react";
import { SMTPServiceSettingsProps } from "../EmailSettings";
import { EyeTwotone, EyeInvisibleTwotone } from "../svg/eye";

const SMTPSettings: FC<SMTPServiceSettingsProps> = ({
  smtpSettingsFormData: formData,
  setSMTPSettingsFormData: setFormData,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-[5px]">
        <div>Hostname</div>
        <Input
          id="smtp-host-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.host}
          onChange={(value) => setFormData({ ...formData, host: value })}
          type="text"
          placeholder="https://yourdomain.com"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <div>Port</div>
        <Input
          id="smtp-port-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={String(formData.port)}
          onChange={(value) =>
            setFormData({ ...formData, port: Number(value) })
          }
          type="number"
          placeholder="25"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <div>Username</div>
        <Input
          id="smtp-username-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.username}
          onChange={(value) => setFormData({ ...formData, username: value })}
          type="text"
          placeholder="johndoe"
        />
      </div>
      <div className="flex flex-col gap-[5px]">
        <div>Password</div>
        <div className="relative">
          <Input
            id="smtp-password-input"
            wrapperClassName="!w-full"
            className="w-full"
            value={formData.password}
            onChange={(value) => setFormData({ ...formData, password: value })}
            type={showPassword ? "text" : "password"}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeInvisibleTwotone className="w-5 h-5 text-gray-500" />
            ) : (
              <EyeTwotone className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-[5px]">
        <div className="flex items-center gap-2">
          <div>Encryption </div>
          <select
            id="smtp-encryption"
            value={formData.encryption}
            onChange={(e) =>
              setFormData({
                ...formData,
                encryption: e.target.value,
                port: e.target.value === "tls" ? 587 : 465,
              })
            }
          >
            <option value="none">None</option>
            <option value="ssl">SSL</option>
            <option value="tls">STARTTLS</option>
          </select>
        </div>
      </div>
      <div className="flex gap-[5px] items-center">
        <div>From:</div>
        <Input
          id="smtp-fromemail-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.fromEmail}
          onChange={(value) => setFormData({ ...formData, fromEmail: value })}
          placeholder="no-reply@yourdomain.com"
          type="email"
        />
        <Input
          id="smtp-fromname-input"
          wrapperClassName="!w-full"
          className="w-full"
          value={formData.fromName}
          onChange={(value) => setFormData({ ...formData, fromName: value })}
          placeholder="Your Company Name"
          type="text"
        />
      </div>
      <div className="flex gap-1 items-center">
        <Checkbox
          id="smtp-ignorecert-input"
          checked={formData.ignoreCertErrors}
          onChange={(e) =>
            setFormData({ ...formData, ignoreCertErrors: e.target.checked })
          }
        />
        <div>Ignore certificate errors (insecure)</div>
      </div>
    </>
  );
};

export default SMTPSettings;
