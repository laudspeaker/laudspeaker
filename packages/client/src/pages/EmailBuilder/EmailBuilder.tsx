import "grapesjs/dist/css/grapes.min.css";
import "grapesjs-preset-newsletter/dist/grapesjs-preset-newsletter.css";
import grapesjs from "grapesjs";
import { useEffect, useState, useLayoutEffect, useRef } from "react";
import "grapesjs-preset-newsletter";
import EmailHeader from "./EmailHeader";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useParams } from "react-router-dom";
import MergeTagType from "./MergeTags";
import { getResources } from "pages/Segment/SegmentHelpers";
import MergeTagInput from "components/MergeTagInput";
import { Helmet } from "react-helmet";
import Progress from "components/Progress";
import { toast } from "react-toastify";

export interface IResourceOptions {
  label: string;
  id?: string;
  where?: string;
  nextResourceURL?: string;
  isPlaceholder?: boolean;
}

export interface Resource {
  label: string;
  id: string;
  type: string;
  options?: IResourceOptions[];
  nextResourceURL?: string;
  range?: {
    min: number;
    max: number;
  };
}

const EmailBuilder = () => {
  const { name } = useParams();
  const [title, setTitle] = useState<string>("");
  const [cc, setCC] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>(name);
  const [editor, setEditor] = useState<grapesjs.Editor>();
  const [emailTemplateId, setEmailTemplateId] = useState<string>();
  const [text, setText] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const subjectRef = useRef<HTMLInputElement>(null);

  const getTemplate = async (templateId: string) => {
    return ApiService.get({
      url: `${ApiConfig.getAllTemplates}/${templateId}`,
    });
  };

  useEffect(() => {
    getResources("attributes")
      .then(({ data }) => {
        setPossibleAttributes(
          data.options.map((option: Resource) => option.label)
        );

        const _editor = grapesjs.init({
          // Indicate where to init the editor. You can also pass an HTMLElement
          container: "#emailBuilder",
          plugins: [
            "gjs-preset-newsletter",
            (__editor, _props) => MergeTagType(__editor, _props, data.options),
          ],
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

        _editor.CssComposer.setRule(".default_m_t", {
          color: "#065F46",
          "font-family": "Inter",
        });

        setEditor(_editor);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    editor?.setStyle(style);
    editor?.setComponents(text, {});
  }, [editor, text, style]);

  useLayoutEffect(() => {
    const populateEmailBuilder = async () => {
      const { data } = await getTemplate(name);
      setTitle(data.subject);
      setCC(data.cc.join());
      setTemplateName(name);
      setEmailTemplateId(data.id);
      setText(data.text);
      setStyle(data.style);
    };
    populateEmailBuilder();
  }, []);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const reqBody = {
        name: templateName,
        subject: title,
        cc: cc.split(",").filter(function (entry) {
          return /\S/.test(entry);
        }),
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
        await ApiService.patch({
          url: `${ApiConfig.getAllTemplates}/${name}`,
          options: {
            ...reqBody,
          },
        });
      }
    } catch (e) {
      toast.error("Error while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const onPersonalize = async () => {
    if (!isPreview) {
      const indexToInsert = subjectRef.current?.selectionStart || title.length;
      const newTitleArr = title.split("");
      newTitleArr.splice(indexToInsert, 0, "{{}}");
      setTitle(newTitleArr.join(""));
      setIsPreview(true);
      return;
    }

    if (!editor) return;
    const availableComponents = ["Text", "Text Section", "Texto"];
    const el = editor.getSelected();

    if (!el) return;

    if (!availableComponents.includes(el?.getName() || "")) {
      return;
    }
    const component = editor.addComponents(
      {
        type: "merge-tag",
      },
      {}
    );
    //
    component[0]?.move(el, {});
  };

  const onAddApiCallClick = () => {
    if (!isPreview) {
      const indexToInsert = subjectRef.current?.selectionStart || title.length;
      const newTitleArr = title.split("");
      newTitleArr.splice(
        indexToInsert,
        0,
        "[{[ eyAidXJsIjogImh0dHBzOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cyIsICJib2R5IjogInt9IiwgIm1ldGhvZCI6ICJHRVQiLCAiaGVhZGVycyI6IHsgIkF1dGhvcml6YXRpb24iOiAiIiB9LCAicmV0cmllcyI6IDUsICJmYWxsQmFja0FjdGlvbiI6IDAgfQ==;response.data ]}]"
      );
      setTitle(newTitleArr.join(""));
      setIsPreview(true);
      return;
    }

    if (!editor) return;
    const availableComponents = ["Text", "Text Section", "Texto"];
    const el = editor.getSelected();

    if (!el) return;

    if (!availableComponents.includes(el?.getName() || "")) {
      return;
    }
    const component = editor.addComponents(
      {
        type: "api-call-tag",
      },
      {}
    );
    //
    component[0]?.move(el, {});
  };

  return (
    <>
      <div hidden={isLoading} className="w-full">
        <Helmet>
          <script>
            {`
            (function (d, t) {
              var BASE_URL = "https://app.chatwoot.com";
              var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
              g.src = BASE_URL + "/packs/js/sdk.js";
              g.defer = true;
              g.async = true;
              s.parentNode.insertBefore(g, s);
              g.onload = function () {
                window.chatwootSDK.run({
                  websiteToken: 'SzjbgmVdjTexxW1nEFLHHBGM',
                  baseUrl: BASE_URL
                })
              }
            })(document, "script");`}
          </script>
        </Helmet>
        <EmailHeader
          onPersonalize={onPersonalize}
          onAddApiCallClick={onAddApiCallClick}
          onSave={onSave}
          loading={isSaving}
          templateName={templateName}
          handleTemplateNameChange={(e) => {
            setTemplateName(e.target.value);
          }}
        />
        <div className="w-full py-0 px-[40px]">
          <MergeTagInput
            isRequired
            value={title}
            placeholder={"Subject"}
            name="title"
            id="title"
            fullWidth
            setValue={setTitle}
            onChange={(e) => setTitle(e.target.value)}
            labelShrink
            isPreview={isPreview}
            setIsPreview={setIsPreview}
            possibleAttributes={possibleAttributes}
            inputRef={subjectRef}
          />
          <MergeTagInput
            value={cc}
            placeholder={"email@email.com,email_two@email.com"}
            name="cc"
            id="title"
            fullWidth
            setValue={setCC}
            onChange={(e) => setCC(e.target.value)}
            labelShrink
            isPreview={false}
            setIsPreview={() => {}}
            possibleAttributes={possibleAttributes}
          />
          <div id="emailBuilder" className="gjs-dashed" />
        </div>
      </div>
      {isLoading && <Progress />}
    </>
  );
};

export default EmailBuilder;
