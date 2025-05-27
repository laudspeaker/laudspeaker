import React, { FC } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";
import { InAppState } from "./types";

interface InAppEditorEmailMenuProps {
  inAppState: InAppState;
  setInAppState: React.Dispatch<React.SetStateAction<InAppState>>;
  returnBack: () => void;
}

const InAppEditorEmailMenu: FC<InAppEditorEmailMenuProps> = ({
  inAppState,
  setInAppState,
  returnBack,
}) => {
  const emailEditorRef = React.useRef<EditorRef | null>(null);

  console.log("Rendering InAppEditorEmailMenu", {
    emailTemplate: inAppState.emailTemplate,
    editorRef: emailEditorRef.current,
  });

  const onReady = () => {
    console.log("Email Editor onReady called", {
      hasTemplate: !!inAppState.emailTemplate,
      editorRef: emailEditorRef.current,
    });

    if (inAppState.emailTemplate) {
      try {
        emailEditorRef.current?.editor?.loadDesign(
          JSON.parse(inAppState.emailTemplate)
        );
      } catch (err) {
        console.error("Error loading email template:", err);
      }
    }
  };

  const exportHtml = () => {
    emailEditorRef.current?.editor?.exportHtml((data) => {
      const { design, html } = data;
      console.log("Exported HTML:", { design, html });

      setInAppState((prevState) => ({
        ...prevState,
        emailTemplate: JSON.stringify(design),
        emailHtml: html,
      }));

      returnBack();
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 bg-white">
        <button
          onClick={() => {
            // Export and save the email design when returning
            returnBack();
          }}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span> Back to Builder
        </button>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => {
              exportHtml();
            }}
            className="text-white bg-blue-600 px-4 py-2 rounded"
          >
            Save & Close
          </button>
          <button
            onClick={() => {
              // Reset emailHtml and close the editor
              setInAppState((prevState) => ({
                ...prevState,
                emailHtml: null,
                emailTemplate: null,
              }));
              returnBack();
            }}
            className="text-gray-600 bg-gray-200 px-4 py-2 rounded"
          >
            Return to Default
          </button>
        </div>
      </div>

      {/* Email Editor */}
      <div className="flex-1 flex">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          style={{ height: "100%", width: "100%", flex: "1" }}
        />
      </div>
    </div>
  );
};

export default InAppEditorEmailMenu;
