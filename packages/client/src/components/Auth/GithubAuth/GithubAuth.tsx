import React from "react";
// eslint-disable-next-line
import LoginGithub from "react-login-github";

export interface GithubProps {
  clientId: string;
  onFailure: (response: any) => void;
  onSuccess: (response: any) => void;
  children?: React.ReactNode;
  redirectUri?: string;
  scope?: string;
  className?: string;
}

const GithubAuth = (props: GithubProps) => {
  const {
    clientId,
    onFailure,
    onSuccess,
    children,
    redirectUri,
    scope,
    className,
  } = props;
  return (
    <LoginGithub
      clientId={clientId}
      onSuccess={onSuccess}
      onFailure={onFailure}
      redirectUri={redirectUri}
      scope={scope}
      className={className}
    >
      {children}
    </LoginGithub>
  );
};

export default GithubAuth;
