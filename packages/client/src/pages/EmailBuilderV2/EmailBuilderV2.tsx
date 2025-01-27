import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";
import { EmailHeader } from "./EmailHeader";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import EmailBuilderTestTab from "./EmailBuilderTestTab";
import { toast } from "react-toastify";
import { ApiConfig } from "../../constants";
import EmailInput from "./EmailInput/EmailInput";

const EmailBuilderV2: FC = () => {
  const [templateName, setTemplateName] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [emailDesign, setEmailDesign] = useState();
  const [HTML, setHTML] = useState("");
  const [title, setTitle] = useState<string>("");
  const [cc, setCC] = useState<string>("");
  const [emailTemplateId, setEmailTemplateId] = useState<string>();
  const [text, setText] = useState<string>("");

  const { id: paramsId } = useParams();

  const id = paramsId;

  const emailEditorRef = useRef<EditorRef>(null);

  const exportHtml = () => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.exportHtml((data) => {
      const { design, html } = data;
      console.log(design, "exportHtml", html);
    });
  };

  const onReady: EmailEditorProps["onReady"] = (unlayer) => {
    // editor is ready
    // you can load your template here;
    // the design json can be obtained by calling
    // unlayer.loadDesign(callback) or unlayer.exportHtml(callback)
    // const templateJson = { DESIGN JSON GOES HERE };
    // unlayer.loadDesign(templateJson);
  };

  // const onSave = async (newName?: string) => {
  //   //
  // };

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  const onSaveEmail = async () => {
    // setIsSaving(true);

    const unlayer = emailEditorRef.current?.editor;

    unlayer?.exportHtml(async (data) => {
      const { design, html } = data;
      setHTML(html);
      console.log(design, "exportHtml", html);

      try {
        const reqBody = {
          name: templateName,
          subject: title,
          // cc: cc.split(",").filter(function (entry) {
          //   return /\S/.test(entry);
          // }),
          // text: JSON.stringify(design),
          text: html,
          style: " ",
          type: "email",
        };
        await ApiService.patch({
          url: `${ApiConfig.getAllTemplates}/${id}`,
          options: {
            ...reqBody,
          },
        });
      } catch (e) {
        toast.error("Error while saving");
      } finally {
        // setIsSaving(false);
      }
    });
  };

  const loadData = async () => {
    if (!id) return;

    const { data } = await ApiService.get<{ name: string }>({
      url: "/templates/" + id,
    });

    setTemplateName(data.name);
  };

  const changeTabIndex = (i: number) => {
    onSaveEmail();
    setPageIndex(i);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useLayoutEffect(() => {
    const populateEmailBuilder = async () => {
      const { data } = await getTemplate(id);
      console.log(data, "data");
      setTitle(data.subject || "");
      if (data?.cc) setCC(data.cc.join());
      setTemplateName(data.name);
      setEmailTemplateId(data.id);
      setText(data.text);
      const design = data.text;
      emailEditorRef.current?.editor?.loadDesign(design);
    };
    populateEmailBuilder();
  }, []);

  useEffect(() => {
    // editor?.setComponents(text, {});
  }, [text]);

  return (
    <div>
      {/* <div>
        <button onClick={exportHtml}>Export HTML</button>
      </div> */}
      <EmailHeader
        templateName={templateName}
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        onSave={onSaveEmail}
      />
      <div className={`${pageIndex != 0 ? "hidden" : ""}`}>
        <div className="w-full mb-2 ">
          <EmailInput
            isRequired
            value={title}
            placeholder={"Subject"}
            name="title"
            id="title"
            fullWidth
            setValue={setTitle}
            onChange={(e) => setTitle(e.target.value)}
          />
          <EmailInput
            value={cc}
            placeholder={"cc: email@email.com,email_two@email.com"}
            name="cc"
            id="title"
            fullWidth
            setValue={setCC}
            onChange={(e) => setCC(e.target.value)}
          />
          <div id="emailBuilder" className="gjs-dashed" />
        </div>
        <EmailEditor ref={emailEditorRef} onReady={onReady} />
      </div>
      {!!pageIndex && <EmailBuilderTestTab data={{}} />}
    </div>
  );
};

export default EmailBuilderV2;
