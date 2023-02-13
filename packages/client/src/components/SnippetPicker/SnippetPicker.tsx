import React, { FC, useEffect, useState } from "react";
import { createSnippet } from "./snippets.fixture";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-plain_text";
import "ace-builds/src-noconflict/theme-monokai";
import { Select } from "components/Elements";

export enum SnippetMode {
  JS_FETCH,
  JS_JQUERY,
  JS_XHR,
  NODEJS_AXIOS,
  NODEJS_NATIVE,
  NODEJS_REQUEST,
  PYTHON_HTTP_CLIENT,
  PYTHON_REQUESTS,
  CURL,
}

export type EditorType = "javascript" | "python" | "plain_text";

const snippetModeToEditorModeMap: Record<SnippetMode, EditorType> = {
  [SnippetMode.JS_FETCH]: "javascript",
  [SnippetMode.JS_JQUERY]: "javascript",
  [SnippetMode.JS_XHR]: "javascript",
  [SnippetMode.NODEJS_AXIOS]: "javascript",
  [SnippetMode.NODEJS_NATIVE]: "javascript",
  [SnippetMode.NODEJS_REQUEST]: "javascript",
  [SnippetMode.PYTHON_HTTP_CLIENT]: "python",
  [SnippetMode.PYTHON_REQUESTS]: "python",
  [SnippetMode.CURL]: "plain_text",
};

export interface SnippetPickerProps {
  userApiKey: string;
}

const SnippetPicker: FC<SnippetPickerProps> = ({ userApiKey }) => {
  const [snippet, setSnippet] = useState("");
  const [snippetMode, setSnippetMode] = useState(SnippetMode.JS_FETCH);

  useEffect(() => {
    setSnippet(createSnippet(userApiKey, snippetMode));
  }, [userApiKey, snippetMode]);

  return (
    <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
      <Select
        options={[
          {
            value: SnippetMode.JS_FETCH,
            title: "Javascript - Fetch",
          },
          {
            value: SnippetMode.JS_JQUERY,
            title: "Javascript - JQuery",
          },
          {
            value: SnippetMode.JS_XHR,
            title: "Javascript - XHR",
          },
          {
            value: SnippetMode.NODEJS_AXIOS,
            title: "Node.js - Axios",
          },
          {
            value: SnippetMode.NODEJS_NATIVE,
            title: "Node.js - Native",
          },
          {
            value: SnippetMode.NODEJS_REQUEST,
            title: "Node.js - Request",
          },
          {
            value: SnippetMode.PYTHON_HTTP_CLIENT,
            title: "Python - http.client",
          },
          {
            value: SnippetMode.PYTHON_REQUESTS,
            title: "Python - requests",
          },
          { value: SnippetMode.CURL, title: "cURL" },
        ]}
        onChange={(val) => setSnippetMode(val)}
        value={snippetMode}
      />
      <AceEditor
        aria-label="editor"
        mode={snippetModeToEditorModeMap[snippetMode]}
        theme="monokai"
        name="editor"
        fontSize={12}
        minLines={15}
        maxLines={40}
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
        value={snippet}
        onChange={(val) => setSnippet(val)}
      />
    </div>
  );
};

export default SnippetPicker;
