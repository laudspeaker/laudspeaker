// import { ChangeEvent, useState } from "react";
// import { Grid, FormControl } from "@mui/material";
// import { GenericButton, Input } from "components/Elements";
// import { useNavigate } from "react-router-dom";
// import { TemplateType } from "types/Template";
// import Select from "components/Elements/Selectv2";
// import ApiConfig from "../../../constants/api";
// import ApiService from "services/api.service";
// import {
//   FallBackAction,
//   WebhookMethod,
// } from "pages/WebhookBuilder/WebhookSettings";
// import { defaultModalState } from "pages/ModalBuilder/ModalBuilder";

// export const requestCreationBody = (templateName: string) => ({
//   [TemplateType.EMAIL]: {
//     name: templateName,
//     type: TemplateType.EMAIL,
//   },
//   [TemplateType.SMS]: {
//     name: templateName,
//     type: TemplateType.SMS,
//   },
//   [TemplateType.WEBHOOK]: {
//     name: templateName,
//     type: TemplateType.WEBHOOK,
//   },
//   [TemplateType.IN_APP_MESSAGE]: {
//     name: templateName,
//     type: TemplateType.IN_APP_MESSAGE,
//     modalState: defaultModalState,
//   },
//   [TemplateType.PUSH]: {
//     name: templateName,
//     type: TemplateType.PUSH,
//   },
// });

// const NameTemplate = () => {
//   const [templateType, setTemplateType] = useState(TemplateType.EMAIL);
//   const [templateName, setTemplateName] = useState("");
//   const navigate = useNavigate();

//   const handleType = (value: TemplateType) => {
//     setTemplateType(value);
//   };

//   // Pushing state back up to the flow builder
//   const handleSubmit = async (e: { preventDefault: () => void }) => {
//     if (templateName && templateType) {
//       const response = await ApiService.post({
//         url: `${ApiConfig.createTemplate}`,
//         options: {
//           // @ts-ignore
//           ...requestCreationBody(templateName)[templateType],
//         },
//       });

//       navigate(`/templates/${templateType}/${response.data.id}`);

//       e.preventDefault();
//     }
//   };

//   return (
//     <div
//       onKeyDown={(e) => {
//         if (e.key === "Enter") handleSubmit(e);
//       }}
//     >
//       <div className="flex items-start justify-center">
//         <div className="w-full">
//           <h3>Template Name:</h3>
//           <Grid container direction={"row"} padding={"10px 0px"}>
//             <FormControl variant="standard">
//               <Input
//                 isRequired
//                 value={templateName}
//                 placeholder={"Enter name"}
//                 name="name"
//                 id="name"
//                 className="w-full px-[16px] py-[15px] bg-[#fff] border border-[#D1D5DB] font-[Inter] text-[16px] "
//                 onChange={(value: any) => {
//                   setTemplateName(value);
//                 }}
//               />
//             </FormControl>
//             <form
//               className="w-auto mt-[20px] flex justify-start items-center"
//               onSubmit={handleSubmit}
//             >
//               <label
//                 htmlFor="handletemplateType"
//                 className="font-[Inter] whitespace-nowrap text-[16px] font-medium mr-1"
//               >
//                 Template Type:
//               </label>
//               <Select
//                 id="handleTemplateType"
//                 value={templateType}
//                 onChange={handleType}
//                 className="min-w-[80px]"
//                 options={[
//                   {
//                     key: TemplateType.EMAIL,
//                     title: "Email",
//                   },
//                   {
//                     key: TemplateType.SMS,
//                     title: "SMS",
//                   },
//                   {
//                     key: TemplateType.WEBHOOK,
//                     title: "Webhook",
//                   },
//                   {
//                     key: TemplateType.PUSH,
//                     title: "Push Notification",
//                   },
//                   { key: TemplateType.IN_APP_MESSAGE, title: "In-App Message" },
//                 ]}
//               />
//             </form>
//           </Grid>
//           <div className="flex justify-end">
//             <GenericButton
//               id="submitTemplateCreation"
//               onClick={handleSubmit}
//               style={{
//                 maxWidth: "200px",
//               }}
//               disabled={!templateName || !templateType}
//             >
//               Create
//             </GenericButton>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NameTemplate;

import { ChangeEvent, useState } from "react";
import { Grid, FormControl } from "@mui/material";
import { GenericButton, Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { TemplateType } from "types/Template";
import Select from "components/Elements/Selectv2";
import ApiConfig from "../../../constants/api";
import ApiService from "services/api.service";
import { defaultInAppState } from "pages/InAppBuilder/InAppBuilder";

export const requestCreationBody = (templateName: string) => ({
  [TemplateType.EMAIL]: {
    name: templateName,
    type: TemplateType.EMAIL,
  },
  [TemplateType.SMS]: {
    name: templateName,
    type: TemplateType.SMS,
  },
  [TemplateType.WEBHOOK]: {
    name: templateName,
    type: TemplateType.WEBHOOK,
  },
  [TemplateType.IN_APP_MESSAGE]: {
    name: templateName,
    type: TemplateType.IN_APP_MESSAGE,
    modalState: defaultInAppState,
  },
  [TemplateType.PUSH]: {
    name: templateName,
    type: TemplateType.PUSH,
  },
});

const NameTemplate = () => {
  const [templateType, setTemplateType] = useState(TemplateType.EMAIL);
  const [templateName, setTemplateName] = useState("");
  const navigate = useNavigate();

  const handleTemplateNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value);
  };

  const handleTypeChange = (value: TemplateType) => {
    setTemplateType(value);
  };

  const handleSubmit = async () => {
    if (templateName && templateType) {
      try {
        const response = await ApiService.post({
          url: ApiConfig.createTemplate,
          options: {
            // @ts-ignore
            ...requestCreationBody(templateName)[templateType],
          },
        });

        navigate(`/templates/${templateType}/${response.data.id}`);
      } catch (error) {
        console.error("Error creating template:", error);
      }
    }
  };

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      <div className="flex items-start justify-center">
        <div className="w-full">
          <h3 className="text-lg font-bold">Template Name:</h3>
          <Grid container direction="row" padding="10px 0">
            <FormControl variant="standard" fullWidth>
              <Input
                isRequired
                value={templateName}
                placeholder="Enter name"
                name="name"
                id="name"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-base"
                onChange={handleTemplateNameChange}
              />
            </FormControl>
            <form
              className="w-auto mt-5 flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <label
                htmlFor="templateType"
                className="text-base font-medium mr-2"
              >
                Template Type:
              </label>
              <Select
                id="templateType"
                value={templateType}
                onChange={handleTypeChange}
                className="min-w-[80px]"
                options={[
                  { key: TemplateType.EMAIL, title: "Email" },
                  { key: TemplateType.SMS, title: "SMS" },
                  { key: TemplateType.WEBHOOK, title: "Webhook" },
                  { key: TemplateType.PUSH, title: "Push Notification" },
                  { key: TemplateType.IN_APP_MESSAGE, title: "In-App Message" },
                ]}
              />
            </form>
          </Grid>
          <div className="flex justify-end mt-4">
            <GenericButton
              id="submitTemplateCreation"
              onClick={handleSubmit}
              style={{ maxWidth: "200px" }}
              disabled={!templateName || !templateType}
            >
              Create
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameTemplate;

// import { ChangeEvent, useState } from "react";
// import { Grid, FormControl } from "@mui/material";
// import { GenericButton, Input } from "components/Elements";
// import { useNavigate } from "react-router-dom";
// import { TemplateType } from "types/Template";
// import Select from "components/Elements/Selectv2";
// import ApiConfig from "../../../constants/api";
// import ApiService from "services/api.service";
// import { defaultModalState } from "pages/ModalBuilder/ModalBuilder";

// export const requestCreationBody = (templateName: string) => ({
//   [TemplateType.EMAIL]: {
//     name: templateName,
//     type: TemplateType.EMAIL,
//   },
//   [TemplateType.SMS]: {
//     name: templateName,
//     type: TemplateType.SMS,
//   },
//   [TemplateType.WEBHOOK]: {
//     name: templateName,
//     type: TemplateType.WEBHOOK,
//   },
//   [TemplateType.IN_APP_MESSAGE]: {
//     name: templateName,
//     type: TemplateType.IN_APP_MESSAGE,
//     modalState: defaultModalState,
//   },
//   [TemplateType.PUSH]: {
//     name: templateName,
//     type: TemplateType.PUSH,
//   },
// });

// const NameTemplate = () => {
//   const [templateType, setTemplateType] = useState(TemplateType.EMAIL);
//   const [templateName, setTemplateName] = useState("");
//   const navigate = useNavigate();

//   const handleTemplateNameChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setTemplateName(e.target.value);
//   };

//   const handleTypeChange = (value: TemplateType) => {
//     setTemplateType(value);
//   };

//   const handleSubmit = async () => {
//     if (templateName && templateType) {
//       try {
//         const response = await ApiService.post({
//           url: ApiConfig.createTemplate,
//           options: {
//             // @ts-ignore
//             ...requestCreationBody(templateName)[templateType],
//           },
//         });

//         navigate(`/templates/${templateType}/${response.data.id}`);
//       } catch (error) {
//         console.error("Error creating template:", error);
//       }
//     }
//   };

//   const handleCancel = () => {
//     setTemplateName("");
//     setTemplateType(TemplateType.EMAIL);
//     navigate(-1); // Navigate back to the previous page
//   };

//   return (
//     <div
//       onKeyDown={(e) => {
//         if (e.key === "Enter") {
//           e.preventDefault();
//           handleSubmit();
//         }
//       }}
//       className="flex items-center justify-center h-screen"
//     >
//       <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
//         <h3 className="text-lg font-medium mb-4">Template Name:</h3>
//         <Grid container direction="row" spacing={2} className="mb-4">
//           <Grid item xs={12}>
//             <FormControl variant="standard" fullWidth>
//               <Input
//                 isRequired
//                 value={templateName}
//                 placeholder="Enter name"
//                 name="name"
//                 id="name"
//                 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base"
//                 onChange={handleTemplateNameChange}
//               />
//             </FormControl>
//           </Grid>
//           <Grid item xs={12}>
//             <form className="w-full flex items-center">
//               <label
//                 htmlFor="templateType"
//                 className="text-base font-medium mr-2"
//               >
//                 Template Type:
//               </label>
//               <Select
//                 id="templateType"
//                 value={templateType}
//                 onChange={handleTypeChange}
//                 className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-base"
//                 options={[
//                   { key: TemplateType.EMAIL, title: "Email" },
//                   { key: TemplateType.SMS, title: "SMS" },
//                   { key: TemplateType.WEBHOOK, title: "Webhook" },
//                   { key: TemplateType.PUSH, title: "Push Notification" },
//                   { key: TemplateType.IN_APP_MESSAGE, title: "In-App Message" },
//                 ]}
//               />
//             </form>
//           </Grid>
//         </Grid>
//         <div className="flex justify-end space-x-4">
//           <GenericButton
//             id="cancelTemplateCreation"
//             onClick={handleCancel}
//             // className="px-4 py-2 border border-gray-300 rounded-md text-base"
//           >
//             Cancel
//           </GenericButton>
//           <GenericButton
//             id="submitTemplateCreation"
//             onClick={handleSubmit}
//             // className="px-4 py-2 bg-blue-600 text-white rounded-md text-base"
//             disabled={!templateName || !templateType}
//           >
//             Create
//           </GenericButton>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NameTemplate;
