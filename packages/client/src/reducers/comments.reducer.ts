export enum ActionType {
  GET_POST_COMMENTS_PENDING = "GET_POST_COMMENTS_PENDING",
  GET_POST_COMMENTS_SUCCESS = "GET_POST_COMMENTS_SUCCESS",
  GET_POST_COMMENTS_FAIL = "GET_POST_COMMENTS_FAIL",
}

interface actionPending {
  type: ActionType.GET_POST_COMMENTS_PENDING;
}

interface actionSuccess {
  type: ActionType.GET_POST_COMMENTS_SUCCESS;
  payload: Comment[];
}

interface actionFail {
  type: ActionType.GET_POST_COMMENTS_FAIL;
  payload: string;
}

export type Action = actionPending | actionSuccess | actionFail;

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

interface State {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

const initialState = {
  comments: [],
  loading: false,
  error: null,
};

const commentReducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case ActionType.GET_POST_COMMENTS_PENDING:
      return {
        loading: true,
        comments: [],
        error: null,
      };
    case ActionType.GET_POST_COMMENTS_SUCCESS:
      return {
        loading: false,
        comments: action.payload,
        error: null,
      };
    case ActionType.GET_POST_COMMENTS_FAIL:
      return {
        loading: false,
        error: action.payload,
        comments: [],
      };
    default:
      return state;
  }
};

export default commentReducer;
