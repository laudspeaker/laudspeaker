import TokenService from "./token.service";

const AuthService = {
  authHeader: (headers: Headers) => {
    const accessToken = TokenService.getLocalAccessToken();
    return {
      ...headers,
      "content-type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };
  },
  refreshAuthHeader: (token: { accessToken: string; refreshToken: string }) => {
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
