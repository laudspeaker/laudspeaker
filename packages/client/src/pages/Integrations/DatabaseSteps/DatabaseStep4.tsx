import React, { FC } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/mode-mysql";
import "ace-builds/src-noconflict/theme-github";
import { DatabaseStepProps } from "../Database";

const DatabaseStep4: FC<DatabaseStepProps> = ({
  formData,
  setFormData,
  errors,
  showErrors,
  handleShowErrors,
}) => {
  return (
    <div>
      <div className="space-y-1 pb-[10px]">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Query</h3>
        <p className="max-w-2xl text-sm text-gray-500">
          Enter your query to get customers
        </p>
      </div>
      <AceEditor
        aria-label="editor"
        mode="mysql"
        theme="github"
        name="editor"
        fontSize={16}
        minLines={15}
        maxLines={10}
        width="100%"
        showPrintMargin={false}
        showGutter
        placeholder="Write your Query here..."
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
        value={formData.query}
        onChange={(val) => {
          setFormData({ ...formData, query: val });
          handleShowErrors("query");
        }}
        onBlur={() => handleShowErrors("query")}
      />
      {showErrors.query &&
        errors.query.map((item) => (
          <p className="mt-2 text-sm text-red-600" id="email-error" key={item}>
            {item}
          </p>
        ))}
    </div>
  );
};

export default DatabaseStep4;
