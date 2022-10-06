import TokenService from "./token.service";

const AuthService = {
  authHeader: (headers: any) => {
    const accessToken = TokenService.getLocalAccessToken();
    return {
      ...headers,
      "content-type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };
  },
  refreshAuthHeader: (token: any) => {
    const { accessToken, refreshToken } = token;
    const user = TokenService.getUser();
    TokenService.setUser({
      ...user,
      accessToken,
      refreshToken,
    });
  },
};

export default AuthService;
