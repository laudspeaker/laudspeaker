import React from "react";
import { useGoogleLogin } from "@react-oauth/google";

export interface GoogleAuthProps {
  clientId: string;
  cookiePolicy: string;
  onFailure: (error: object) => void;
  onSuccess: (response: object) => void;
  children?: JSX.Element;
  // onClick?: () => void
}

const GoogleAuth = (props: GoogleAuthProps) => {
  const { onFailure, onSuccess, children } = props;
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: (err) => onFailure(err),
  });
  return (
    // <GoogleLogin
    //   clientId={clientId}
    //   onFailure={onFailure}
    //   onSuccess={onSuccess}
    //   cookiePolicy={cookiePolicy}
    //   render={render}
    // />
    <div onClick={() => login()}>{children}</div>
  );
};

export default GoogleAuth;
