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

export interface Resource {
  label: string;
  id: string;
  nextResourceURL: string;
}

const EmailBuilder = () => {
  const { name } = useParams();
  const [title, setTitle] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("My email template");
  const [editor, setEditor] = useState<grapesjs.Editor>();
  const [emailTemplateId, setEmailTemplateId] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [possibleAttributes, setPossibleAttributes] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);

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
      await ApiService.patch({
        url: `${ApiConfig.getAllTemplates}/${name}`,
        options: {
          ...reqBody,
        },
      });
    }
  };

  const onPersonalize = async () => {
    if (!editor) return;
    if (!isPreview) {
      const indexToInsert = subjectRef.current?.selectionStart || title.length;
      const newTitleArr = title.split("");
      newTitleArr.splice(indexToInsert, 0, "{{}}");
      setTitle(newTitleArr.join(""));
      setIsPreview(true);
      return;
    }
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

  return (
    <div className="w-full">
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
        onSave={onSave}
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
        <div id="emailBuilder" className="gjs-dashed" />
      </div>
    </div>
  );
};

export default EmailBuilder;
