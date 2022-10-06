import "grapesjs/dist/css/grapes.min.css";
import "grapesjs-preset-newsletter/dist/grapesjs-preset-newsletter.css";
import grapesjs from "grapesjs";
import { useEffect, useState, useLayoutEffect } from "react";
import "grapesjs-preset-newsletter";
import Drawer from "../../components/Drawer";
import EmailHeader from "./EmailHeader";
import { Input } from "../../components/Elements";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";

const EmailBuilder = () => {
  const { name } = useParams();
  const [title, setTitle] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My email template");
  const [editor, setEditor] = useState<grapesjs.Editor>();
  const [emailTemplateId, setEmailTemplateId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [style, setStyle] = useState<string>("");

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  useEffect(() => {
    const _editor = grapesjs.init({
      // Indicate where to init the editor. You can also pass an HTMLElement
      container: "#emailBuilder",
      plugins: ["gjs-preset-newsletter"],
      pluginsOpts: {
        "gjs-preset-newsletter": {
          modalTitleImport: "Import template",
          // ... other options
        },
      },
      // Get the content for the canvas directly from the element
      // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
      fromElement: true,
      // Size of the editor
      height: "100vh",
      width: "auto",
      // Disable the storage manager for the moment
      storageManager: false,
      // Avoid any default panel
      // panels: { defaults: [] },
    });

    setEditor(_editor);
  }, []);

  useEffect(() => {
    editor?.setStyle(style);
    editor?.setComponents(text, {});
  }, [editor, text, style]);

  useLayoutEffect(() => {
    const populateEmailBuilder = async () => {
      const { data } = await getTemplate(name);
      setTitle(data.subject);
      setTemplateName(name);
      setEmailTemplateId(data.id);
      setText(data.text);
      setStyle(data.style);
    };
    populateEmailBuilder();
  }, []);

  const onSave = async () => {
    const reqBody = {
      name: templateName,
      subject: title,
      text: editor?.getHtml(),
      style: editor?.getCss(),
      type: "email",
    };
    if (emailTemplateId == null) {
      const response = await ApiService.post({
        url: `${ApiConfig.createTemplate}`,
        options: {
          ...reqBody,
        },
      });
      setEmailTemplateId(response.data.id);
    } else {
      const response = await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${name}`,
        options: {
          ...reqBody,
        },
      });
    }
  };

  const onExport = () => {};

  return (
    <>
      <Drawer />
      <EmailHeader
        onExport={onExport}
        onSave={onSave}
        templateName={templateName}
        handleTemplateNameChange={(e: any) => setTemplateName(e.target.value)}
      />
      <div
        style={{
          width: "calc(100vw - 154px)",
          marginLeft: "154px",
          padding: "0 40px",
        }}
      >
        <Input
          isRequired
          value={title}
          placeholder={"Subject"}
          name="title"
          id="title"
          fullWidth
          onChange={(e: any) => setTitle(e.target.value)}
          labelShrink
          sx={{
            marginBottom: "30px",
          }}
        />
        <div id="emailBuilder" className="gjs-dashed" />
      </div>
    </>
  );
};

export default EmailBuilder;
