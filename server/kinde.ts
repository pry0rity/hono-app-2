import {createKindeServerClient, type SessionManager, GrantType} from "@kinde-oss/kinde-typescript-sdk";
import type { Context } from "hono";
import type { CookieOptions } from "hono/utils/cookie";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

// Client for authorization code flow
export const kindeClient = createKindeServerClient(GrantType.AUTHORIZATION_CODE, {
  authDomain: process.env.KINDE_DOMAIN!,
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  redirectURL: process.env.KINDE_REDIRECT_URI!,
  logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URI!
});

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  path: '/'
};

export const sessionManager = (c: Context): SessionManager => ({
  async getSessionItem(key: string) {
    const cookie = getCookie(c, key);
    return cookie;
  },
  async setSessionItem(key: string, value: unknown) {
    if(typeof value === 'string') {
      setCookie(c, key, value, cookieOptions);
    } else {
      setCookie(c, key, JSON.stringify(value), cookieOptions);
    }
  },
  async removeSessionItem(key: string) {
    deleteCookie(c, key);
  },
  async destroySession() {
    ["id_token", "access_token", "refresh_token"].forEach(key => deleteCookie(c, key));
  }
})