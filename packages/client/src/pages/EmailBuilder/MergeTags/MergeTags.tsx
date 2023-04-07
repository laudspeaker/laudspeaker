import grapesjs from "grapesjs";
import { Resource } from "../EmailBuilder";
import generateTagPicker from "./TagPickerGenerator";
import { Buffer } from "buffer";
import ReactDOM from "react-dom";
import ApiCallMergeTagModal from "./ApiCallMergeTagModal";
import {
  FallBackAction,
  WebhookMethod,
  WebhookState,
} from "pages/WebhookBuilder/WebhookSettings";

interface ICustomView extends grapesjs.ComponentViewDefinition {
  isDropdownOpen?: boolean;
  tagPiker?: HTMLElement;
  handleUpdateTag?: (str: string) => void;
  togglePicker?: () => void;
}

interface ICustomApiCallTagView extends grapesjs.ComponentViewDefinition {
  isDropdownOpen?: boolean;
  tagPiker?: HTMLElement;
  handleUpdateTag?: (webkookState: WebhookState, webhookProps: string) => void;
  togglePicker?: () => void;
  getContent?: () => string;
}

const defaultWebhookState: WebhookState = {
  url: "https://jsonplaceholder.typicode.com/posts",
  method: WebhookMethod.GET,
  body: "{}",
  headers: {},
  fallBackAction: FallBackAction.NOTHING,
  retries: 5,
};

const MergeTagType = (
  __editor: grapesjs.Editor,
  props: {},
  options: Resource[]
) => {
  const domc = __editor.DomComponents;
  const defaultType = domc.getType("default");
  const textType = domc.getType("text");
  const textModel = textType.model;

  domc.addType("text", {
    model: textModel.extend(
      {
        defaults: Object.assign({}, textModel.prototype.defaults, {
          tagName: "div",
          name: "Text",
          draggable: "*",
          droppable: true,
          attributes: {
            class: "text_droppable",
          },
        }),
      },
      {
        isComponent: function (el: Element) {
          if (el.tagName == "DIV" && el.classList.contains("text_droppable")) {
            return { type: "text" };
          }
        },
      }
    ),
  });

  domc.addType("merge-tag", {
    isComponent: (el) =>
      el.classList?.contains("m_t") ||
      (el?.hasAttribute && el.hasAttribute("picked-attribute")),
    model: {
      defaults: {
        tagName: "span",
        type: "merge-tag",
        droppable: false,
        name: "Merge tag",
        "picked-attribute": "",
        editable: false,
        textable: 1,
        attributes: {
          class: "m_t default_m_t",
          contenteditable: "false",
        },
        content: `{{ }}`,
        style: {
          display: "inline-block",
          "border-radius": "10px",
          padding: "2px 10px",
          background: "#D1FAE5",
          position: "relative",
        },
        unstylable: [
          "display",
          "width",
          "height",
          "padding",
          "max-width",
          "min-height",
          "text-align",
        ],
        traits: [
          {
            type: "select",
            label: "Customer attribute",
            name: "picked-attribute",
            options: options.map((option) => ({
              id: option.id,
              name: option.label,
            })),
          },
        ],
      },
      init() {
        setTimeout(() => {
          this.getEl().innerHTML =
            "Customer: " +
            (this.attributes.attributes?.["picked-attribute"] || "-");
        }, 100);

        this.on("component:update", (ev) => {
          const changed = ev?.changed;
          const component: grapesjs.ComponentModelProperties = ev?.component;

          // this.getEl().innerHTML =
          //   "Customer: " +
          //   (this.attributes.attributes?.["picked-attribute"] || "-");

          if (changed?.attributes?.["picked-attribute"] && component) {
            this.set(
              "content",
              `{{ ${changed?.attributes?.["picked-attribute"]} }}`
            );
            this.components(
              `{{ ${changed?.attributes?.["picked-attribute"]} }}`
            );
            // this.getEl().innerHTML =
            //   "Customer: " + (changed?.attributes?.["picked-attribute"] || "-");
            // this.addAttributes({ contenteditable: "false" }, {});
          }
        });
      },
    },
    view: defaultType.view.extend({
      tagName: "span",
      events: {
        dblclick: "dblClick",
      },
      init({ model }) {
        this.isDropdownOpen = false;

        this.handleUpdateTag = (str: string) => {
          model.addAttributes({ "picked-attribute": str }, {});
          this.isDropdownOpen = false;
        };
      },

      //@ts-ignore
      dblClick() {
        this.isDropdownOpen = !this.isDropdownOpen;
        this.togglePicker?.();
      },

      togglePicker() {
        const picker = this.tagPiker || document.createElement("div");

        if (this.isDropdownOpen && this.handleUpdateTag) {
          //@ts-ignore
          const el = this.$el as HTMLElement[];
          picker.appendChild(
            generateTagPicker({ options, onClick: this.handleUpdateTag })
          );

          el[0].appendChild(picker);
          this.tagPiker = picker;
        } else {
          picker.remove();
          this.tagPiker = undefined;
        }
      },
    } as ICustomView),
  });

  domc.addType("api-call-tag", {
    isComponent: (el) =>
      el.classList?.contains("api_call_m_t") ||
      (el?.hasAttribute && el.hasAttribute("webhookState")),
    model: {
      defaults: {
        tagName: "span",
        type: "api-call-tag",
        droppable: false,
        name: "Api call tag",
        "picked-attribute": "",
        editable: false,
        textable: 1,
        attributes: {
          class: "api_call_m_t default_api_call_m_t",
          contenteditable: "false",
          webhookState: JSON.stringify(defaultWebhookState),
          webhookProps: "response.data",
        },
        content: `[{[ eyAidXJsIjogImh0dHBzOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS9wb3N0cyIsICJib2R5IjogInt9IiwgIm1ldGhvZCI6ICJHRVQiLCAiaGVhZGVycyI6IHsgIkF1dGhvcml6YXRpb24iOiAiIiB9LCAicmV0cmllcyI6IDUsICJmYWxsQmFja0FjdGlvbiI6IDAgfQ==;response.data ]}]`,
        style: {
          display: "inline-block",
          "border-radius": "10px",
          padding: "2px 10px",
          background: "#D1FAE5",
          position: "relative",
        },
        unstylable: [
          "display",
          "width",
          "height",
          "padding",
          "max-width",
          "min-height",
          "text-align",
        ],
        // traits: [
        //   {
        //     type: "input",
        //     label: "URL",
        //     name: "url",
        //     default: "https://jsonplaceholder.typicode.com/posts",
        //   },
        //   {
        //     type: "select",
        //     label: "Method",
        //     name: "method",
        //     default: WebhookMethod.GET,
        //     options: [
        //       { id: WebhookMethod.GET, name: WebhookMethod.GET },
        //       { id: WebhookMethod.POST, name: WebhookMethod.POST },
        //       { id: WebhookMethod.PATCH, name: WebhookMethod.PATCH },
        //       { id: WebhookMethod.PUT, name: WebhookMethod.PUT },
        //       { id: WebhookMethod.DELETE, name: WebhookMethod.DELETE },
        //       { id: WebhookMethod.HEAD, name: WebhookMethod.HEAD },
        //       { id: WebhookMethod.OPTIONS, name: WebhookMethod.OPTIONS },
        //     ],
        //   },
        //   {
        //     type: "input",
        //     label: "Body",
        //     name: "body",
        //     default: "{}",
        //   },
        //   {
        //     type: "input",
        //     label: "Headers",
        //     name: "headers",
        //     default: "",
        //   },
        //   {
        //     type: "number",
        //     label: "Retries",
        //     name: "retries",
        //     default: "5",
        //   },
        //   {
        //     type: "select",
        //     label: "Fallback action",
        //     name: "fallBackAction",
        //     default: "Nothing",
        //     options: [
        //       { id: FallBackAction.NOTHING.toString(), name: "Nothing" },
        //     ],
        //   },
        // ],
      },
      init() {
        setTimeout(() => {
          this.getEl().innerHTML =
            "Api call: " +
            `${this.attributes.attributes?.method} ${this.attributes.attributes?.url}`;
        }, 100);

        if (this.attributes.attributes?.webhookstate) {
          const { url, method, body, headers, retries, fallBackAction } =
            JSON.parse(this.attributes.attributes.webhookstate);

          const newWebhookState = {
            ...JSON.parse(this.attributes.attributes.webhookstate),
            url,
            method,
            body,
            headers,
            retries,
            fallBackAction,
          };

          this.attributes.attributes.webhookState =
            JSON.stringify(newWebhookState);

          const webhookStateBase64 = Buffer.from(
            JSON.stringify(newWebhookState)
          ).toString("base64");

          if (this.attributes.attributes?.webhookprops) {
            this.attributes.attributes.webhookProps =
              this.attributes.attributes.webhookprops;
          }

          const newValue = `[{[ ${webhookStateBase64};${
            this.attributes.attributes?.webhookProps || "response.data"
          } ]}]`;

          this.set("content", newValue);
          this.components(newValue);
        }
        console.log(this.attributes.attributes);

        let oldWebhookProps =
          this.attributes.attributes?.webhookProps || "response.data";
        this.on("component:update", (ev) => {
          const changed = ev?.changed;
          const component: grapesjs.ComponentModelProperties = ev?.component;

          if (!component) return;

          if (!this.attributes.attributes?.webhookState) return;

          const webhookState: WebhookState = JSON.parse(
            this.attributes.attributes.webhookState
          );

          if (!webhookState) return;

          const oldWebhookStateBase64 = Buffer.from(
            JSON.stringify(webhookState)
          ).toString("base64");

          if (changed?.attributes?.url)
            webhookState.url = changed.attributes.url;

          if (changed?.attributes?.method)
            webhookState.method = changed.attributes.method;

          if (changed?.attributes?.body)
            webhookState.body = changed.attributes.body;

          if (changed?.attributes?.headers)
            webhookState.headers = changed.attributes.headers;

          if (changed?.attributes?.retries)
            webhookState.retries = changed.attributes.retries;

          if (changed?.attributes?.fallBackAction)
            webhookState.fallBackAction = changed.attributes.fallBackAction;

          if (changed?.attributes?.webhookProps)
            this.attributes.attributes.webhookProps =
              changed.attributes.webhookProps;

          const webhookStateBase64 = Buffer.from(
            JSON.stringify(webhookState)
          ).toString("base64");

          const newWebhookProps =
            this.attributes.attributes.webhookProps || "response.data";

          if (
            oldWebhookStateBase64 === webhookStateBase64 &&
            oldWebhookProps === newWebhookProps
          )
            return;

          this.attributes.attributes.webhookState =
            JSON.stringify(webhookState);

          const newValue = `[{[ ${webhookStateBase64};${newWebhookProps} ]}]`;
          oldWebhookProps = newWebhookProps;

          this.set("content", newValue);
          this.components(newValue);
        });
      },
    },
    view: defaultType.view.extend({
      tagName: "span",
      events: {
        dblclick: "dblClick",
      },
      init({ model }) {
        this.isDropdownOpen = false;

        this.handleUpdateTag = (
          webhookState: WebhookState,
          webhookProps: string
        ) => {
          model.addAttributes({ ...webhookState, webhookProps }, {});
          this.isDropdownOpen = false;
          // model.getEl().innerHTML =
          //   "Api call: " +
          //   `${model.attributes.attributes?.method} ${model.attributes.attributes?.url}`;
        };

        this.getContent = () =>
          model.get("content")?.replace("[{[", "")?.replace("]}]", "") || "";
      },

      //@ts-ignore
      dblClick() {
        this.isDropdownOpen = !this.isDropdownOpen;
        this.togglePicker?.();
      },

      togglePicker() {
        const rootElement = document.getElementById("email-apicall-modal-root");
        if (!rootElement) return;

        ReactDOM.unmountComponentAtNode(rootElement);

        if (!this.isDropdownOpen) return;

        console.log(this.getContent?.());

        console.log(
          "Api call tag content: ",
          Buffer.from(this.getContent?.() || "", "base64").toString("utf8")
        );

        ReactDOM.render(
          <ApiCallMergeTagModal
            itemContent={this.getContent?.() || ""}
            handleUpdateTag={this.handleUpdateTag || (() => {})}
            onClose={() => ReactDOM.unmountComponentAtNode(rootElement)}
          />,
          rootElement
        );
      },
    } as ICustomApiCallTagView),
  });
};

export default MergeTagType;
