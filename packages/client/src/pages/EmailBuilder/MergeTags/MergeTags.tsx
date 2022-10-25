import grapesjs from "grapesjs";
import { Resource } from "../EmailBuilder";
import generateTagPicker from "./TagPickerGenerator";

interface ICustomView extends grapesjs.ComponentViewDefinition {
  isDropdownOpen?: boolean;
  tagPiker?: HTMLElement;
  handleUpdateTag?: (str: string) => void;
  togglePicker?: () => void;
}

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
        isComponent: function (el: any) {
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

          this.getEl().innerHTML =
            "Customer: " +
            (this.attributes.attributes?.["picked-attribute"] || "-");

          if (changed?.attributes?.["picked-attribute"] && component) {
            this.set(
              "content",
              `{{ ${changed?.attributes?.["picked-attribute"]} }}`
            );
            this.components(
              `{{ ${changed?.attributes?.["picked-attribute"]} }}`
            );
            this.getEl().innerHTML =
              "Customer: " + (changed?.attributes?.["picked-attribute"] || "-");
            this.addAttributes({ contenteditable: "false" }, {});
          }
        });
      },
    },
    view: defaultType.view.extend({
      tagName: "div",
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
};

export default MergeTagType;
