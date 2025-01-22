import { Hono } from 'hono' 
import { kindeClient, sessionManager } from '../kinde'

const app = new Hono()

export const authRoute = new Hono()
  .get("/login", async (c) => {    
    const loginUrl = await kindeClient.login(sessionManager(c));
    console.log(loginUrl.toString());
    return c.redirect(loginUrl.toString());
  })
  
  .get("/register", async (c) => {
    const registerUrl = await kindeClient.register(sessionManager(c));
    return c.redirect(registerUrl.toString());
  })

  .get("/callback", async (c) => {
    //called every time we login or register
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return c.redirect("/login");
    }
    const session = await kindeClient.handleRedirectToApp(sessionManager(c), url);
    return c.redirect("/");
  })

  .get("/logout", async (c) => {
    await kindeClient.logout(sessionManager(c));
    return c.redirect("/");
  })

  .get("/me", async (c) => {
    const manager = sessionManager(c);
    const isAuthenticated = await kindeClient.isAuthenticated(manager);

    if(!isAuthenticated) {
      return c.json({ error: "You are not authenticated" }, 401);
    }

    const user = await kindeClient.getUserProfile(manager);
    return c.json({ user });
  })
