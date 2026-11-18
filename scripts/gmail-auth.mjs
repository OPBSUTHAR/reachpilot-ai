#!/usr/bin/env node
/**
 * One-time Gmail OAuth helper for ReachPilot.
 *
 * 1. Create an OAuth 2.0 Web application in Google Cloud.
 * 2. Enable the Gmail API and add http://localhost:53682/oauth2callback
 *    as an authorised redirect URI.
 * 3. Put GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local.
 * 4. Run: npm run gmail:auth
 *
 * The script opens the consent screen, exchanges the code, prints the refresh
 * token, and never writes credentials to disk.
 */
import { exec } from "node:child_process";
import { randomBytes } from "node:crypto";
import http from "node:http";

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const port = 53682;
const redirectUri = `http://localhost:${port}/oauth2callback`;
const scope = "https://www.googleapis.com/auth/gmail.modify";

if (!clientId || !clientSecret) {
  console.error(
    "\nMissing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET.\n" +
      "Add them to .env.local, then run: npm run gmail:auth\n",
  );
  process.exit(1);
}

const state = randomBytes(24).toString("hex");
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

function page(title, message) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:system-ui,sans-serif;background:#f6f4ee;color:#202a24;display:grid;place-items:center;min-height:100vh;margin:0}
  main{max-width:520px;background:#fbfaf6;border:1px solid #e1ded3;border-radius:18px;padding:32px;line-height:1.6}
  h1{font-family:Georgia,serif;font-weight:400;margin:0 0 8px;font-size:28px}code{background:#e9efe6;padding:2px 6px;border-radius:6px}</style>
  </head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}

console.log("\nReachPilot · Gmail authorisation");
console.log("Open this URL if the browser does not open automatically:\n");
console.log(authUrl.toString());
console.log("\nWaiting for the Google callback…\n");

if (process.platform === "win32") {
  exec(`start "" "${authUrl.toString()}"`);
} else if (process.platform === "darwin") {
  exec(`open "${authUrl.toString()}"`);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", redirectUri);
  if (url.pathname !== "/oauth2callback") {
    response.writeHead(404).end();
    return;
  }

  const returnedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
    response.end(page("Authorisation cancelled", "Google returned an error. You can close this tab and try again."));
    console.error(`Google returned: ${error}`);
    server.close();
    process.exitCode = 1;
    return;
  }

  if (!code || returnedState !== state) {
    response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
    response.end(page("Invalid callback", "The state check failed. Close this tab and run the command again."));
    server.close();
    process.exitCode = 1;
    return;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.refresh_token) {
      throw new Error(
        tokens.error_description ??
          "No refresh token was returned. Remove ReachPilot from your Google account permissions and run the command again.",
      );
    }

    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    const email = profile.emailAddress ?? "the authorised account";

    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      page(
        "Gmail connected",
        `Authorised <strong>${email}</strong>. Return to the terminal, copy the refresh token into <code>.env.local</code>, and restart the app.`,
      ),
    );

    console.log("Authorised account:", email);
    console.log("\nAdd these lines to .env.local:\n");
    console.log(`GMAIL_SENDER_EMAIL=${email}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\nKeep the refresh token secret. Do not commit it.\n");
  } catch (caught) {
    response.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    response.end(page("Could not finish", "The token exchange failed. Check the terminal for details."));
    console.error(caught instanceof Error ? caught.message : caught);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

const timeout = setTimeout(() => {
  console.error("\nTimed out after 5 minutes. Run the command again when ready.");
  server.close();
  process.exitCode = 1;
}, 5 * 60 * 1000);

server.on("close", () => clearTimeout(timeout));
server.listen(port, "127.0.0.1");
