import React, { useState } from "react";
import { getComments } from "../../reducers/comments";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "../../hooks/useTypeSelector";
import { Box } from "@mui/material";

function App() {
  const dispatch = useDispatch();
  const [postId, setPostID] = useState("");
  const { comments, loading, error } = useTypedSelector(
    (state) => state.comments
  );

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await dispatch(getComments(postId));
  };

  return (
    <div>
      <div>
        <form onSubmit={onSubmitHandler}>
          <input
            type={"number"}
            value={postId}
            onChange={(e) => setPostID(e.target.value)}
          />
          \<button type="submit"> submit </button>
        </form>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {comments.map((comment) => {
            return <li key={comment.id}>{comment.body}</li>;
          })}
        </ul>
      )}
      <div>
        <Box
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            borderRadius: 2,
            p: 2,
            minWidth: 300,
            color: "text.secondary",
          }}
        >
          Test
        </Box>
      </div>
    </div>
  );
}

export default App;
