import { ApiConfig, AppConfig } from "../constants";
import ApiService from "services/api.service";

class TokenService {
  getLocalRefreshToken() {
    const user = this.getUser();
    return user?.refreshToken;
  }

  getLocalAccessToken() {
    const user = this.getUser();
    return user?.accessToken;
  }

  updateLocalAccessToken(token: string) {
    const user = this.getUser();
    user.accessToken = token;
    localStorage.setItem(AppConfig.storageKeys.USER_DATA, JSON.stringify(user));
  }

  isUserLoggedIn() {
    const user = this.getUser();
    return !!user?.accessToken;
  }

  getUser() {
    return JSON.parse(
      localStorage.getItem(AppConfig.storageKeys.USER_DATA) || "{}"
    );
  }

  setUser(user: any) {
    localStorage.setItem(AppConfig.storageKeys.USER_DATA, JSON.stringify(user));
  }

  removeUser() {
    localStorage.removeItem(AppConfig.storageKeys.USER_DATA);
  }

  async verify(): Promise<boolean> {
    try {
      await ApiService.get({
        url: `${ApiConfig.verify}`,
      });
      return true;
    } catch (e: any) {
      return false;
    }
  }
}
export default new TokenService();
