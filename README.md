# 🎓 StudyTube - Smart YouTube Learning Companion  


<div align="center">
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/f26fd3ea-c076-4d4c-bb5c-ecc8919a110b" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/43508215-ce58-49c8-95dc-2adb1926749a" width="100%"/></td>
  </tr>
</table>

  <p><em>Revolutionizing the way students learn from YouTube</em></p>
</div>



## 🌟 Inspiration
Exams are about to come in a month and you are watching countless educational videos on YouTube, feeling productive and prepared. But then, exam week arrives, and the real challenge begins—revision. You think to yourself, "How am I going to review all these videos in time?"

Your options?<br/>
1️⃣ Pause every few seconds to jot down notes—tedious and time-consuming.<br/>
2️⃣ Screenshot key moments, paste them into a Word document, and scramble to add context—frustrating, right?<br/>
3️⃣ Spend hours organizing everything instead of actually revising.<br/>
<br/>

And then, just when you need clarity the most, a doubt pops up about a concept or explanation. **You wish you could directly ask the tutor in the video, "Can you explain that part again?"**

What if there was a better way?
What if you could:

Watch videos, take snapshots of important moments, and instantly get a clean, organized PDF—complete with timestamps and all your notes?
Ask questions directly about the video and get detailed, timestamped answers from an AI-powered tutor simulating the expertise of the instructor?
That’s exactly why we created Study Tube: a tool that takes the effort out of revision and provides quick doubt resolution, so you can focus on what matters most—learning and acing your exams!

## 🚀 What it does  
StudyTube is a Chrome extension designed to revolutionize the way students engage with YouTube educational content. It offers:  
- ✍️ **Timestamped Notes**: Take snapshots of video moments with timestamps while watching. These are compiled into a PDF where each snapshot is clickable, taking you back to the exact video moment.  
- 📂 **Playlist Notes**: Combine notes from entire playlists into one organized PDF, reducing clutter.  
- 🤖 **AI-Powered Assistance**: Summarize videos, clarify doubts, and get detailed explanations with AI responses that include timestamps.  

## 🛠️ How to Use StudyTube  

---

### Step 1: Start Watching any YouTube video

Simply click on the extension button present in the YouTube control menu.

<img src="https://github.com/user-attachments/assets/64279402-1a35-43e0-a44b-40e0d0ca9abc" />

---

### Step 2: Take timestamped notes

Click to capture important moments with automatic timestamps and add your notes.

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0387e2d6-81c4-4e8f-9545-658513cbb181" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/43ddf5aa-7545-4e2c-b821-c784bf1d3106" width="100%"/></td>
  </tr>
</table>

---

### Step 3: Chat with AI about specific notes

Reference your notes with `@note1`, `@note2` syntax to get targeted AI assistance.

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/45a38783-d1e2-4602-95b8-d2c9e898c9ec" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/c2542b0b-2dde-47b0-9294-318eb56c6187" width="100%"/></td>
  </tr>
</table>


---

### Step 4: Generate study materials

Create flashcards, summaries, and study guides from your notes with one click.

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/59c27a8c-76b8-4c1b-8b59-727a26344acf" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/c72b25a0-8f0d-469e-9d21-43d93e67215d" width="100%"/></td>
  </tr>
</table>
---



## 🔐 Civic Auth in Chrome Extensions (Unofficial Integration)

> ⚠️ **Note**: [Civic](https://www.civic.com/) does **not officially support** authentication inside Chrome Extensions.
> ✅ I have built a full PKCE-based workaround using `chrome.identity` that **enables Civic login in Chrome Extensions**.

This solution is battle-tested for Civic OAuth2 and can be used by **other devs** building Chrome Extensions for Web3 apps.

---

### ✨ Features

* Uses [PKCE](https://oauth.net/2/pkce/) flow for secure OAuth
* Civic login using `chrome.identity.launchWebAuthFlow`
* Fetches Civic user profile and stores token securely
* Logout with token + session cleanup
* Built-in `isSignedIn` and `getAccessToken` helpers

---

### 🚀 Usage (API)

```ts
await signInWithCivic();              // Launch Civic sign-in popup
const user = await getCivicUserInfo(); // Get Civic user details
const isSignedIn = await isUserSignedIn(); // Check login status
const token = await getAccessToken(); // Get Civic access token
await logoutCivic();                 // Log out and clean session
```

---

### 🧩 Civic Auth Chrome Extension Implementation

```ts
const CIVIC_CLIENT_ID = "YOUR_CLIENT_ID";
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const CIVIC_TOKEN_URL = "https://auth.civic.com/oauth/token";
const CIVIC_USERINFO_URL = "https://auth.civic.com/oauth/userinfo";

function generateCodeVerifier(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length])
    .join('');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function signInWithCivic() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  await chrome.storage.local.set({ civicCodeVerifier: codeVerifier, civicState: state });

  const authUrl = `https://auth.civic.com/oauth/auth?` + new URLSearchParams({
    response_type: "code",
    client_id: CIVIC_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
    prompt: "login",
  });

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError.message);

        if (redirectUrl) {
          const url = new URL(redirectUrl);
          const code = url.searchParams.get("code");
          const returnedState = url.searchParams.get("state");

          const { civicCodeVerifier, civicState } = await chrome.storage.local.get(["civicCodeVerifier", "civicState"]);
          if (returnedState !== civicState) return reject("State mismatch. Possible CSRF attack.");

          try {
            const tokenRes = await fetch(CIVIC_TOKEN_URL, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: CIVIC_CLIENT_ID,
                code: code || "",
                redirect_uri: REDIRECT_URI,
                code_verifier: civicCodeVerifier,
              }),
            });

            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
              await chrome.storage.local.set({ civicToken: tokenData });
              resolve();
            } else {
              reject("Failed to retrieve access token");
            }
          } catch (err) {
            reject("Token exchange failed: " + err);
          }
        } else {
          reject("Authorization failed.");
        }
      }
    );
  });
}

export async function getCivicUserInfo() {
  const { civicToken } = await chrome.storage.local.get("civicToken");
  if (!civicToken || !civicToken.access_token) return null;

  try {
    const res = await fetch(CIVIC_USERINFO_URL, {
      headers: { Authorization: `Bearer ${civicToken.access_token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user info");
    return await res.json();
  } catch (error) {
    console.error("User info error:", error);
    return null;
  }
}

export async function logoutCivic() {
  await chrome.storage.local.remove(["civicToken", "civicCodeVerifier", "civicState"]);
  const logoutUrl = "https://auth.civic.com/logout";
  chrome.identity.launchWebAuthFlow({ url: logoutUrl, interactive: true }, (url) => {
    console.log("Logged out from Civic.");
  });
}

export async function isUserSignedIn() {
  const { civicToken } = await chrome.storage.local.get("civicToken");
  return !!(civicToken && civicToken.access_token);
}

export async function getAccessToken() {
  const { civicToken } = await chrome.storage.local.get("civicToken");
  return civicToken?.access_token ?? null;
}
```

---

### 📎 Notes

* This was tested using Manifest V3.
* Be sure to add the following permissions in your `manifest.json`:

```json
"permissions": ["identity", "storage"],
"oauth2": {
  "client_id": "YOUR_CLIENT_ID",
  "scopes": ["openid", "profile", "email"]
},
"externally_connectable": {
  "matches": ["https://*.chromiumapp.org/"]
}
```

* Register your `https://<EXTENSION_ID>.chromiumapp.org/` URL in the [Civic Developer Console](https://www.civic.com/).

---



## 🛠️ Technical Implementation  
- **Frontend**: Chrome extension UI built with React and Tailwind CSS and Website with Next js
- **Authentication**: Civic Auth Web3
- **AI Integration**: Gemini and Pinecone for vector search
- **Storage**: Chrome extension storage and Supabase for saving notes and preferences
- **PDF Generation**: React PDF library for creating study materials  

## 🏆 Why StudyTube Stands Out  
Unlike other note-taking extensions, StudyTube:  
- Deeply integrates with YouTube's learning ecosystem  
- Provides AI that understands educational context  
- Creates actionable study materials from passive watching  
- Works completely offline for uninterrupted learning  

## 🚀 Future Roadmap  
- Mobile app version for on-the-go learning  
- Collaborative study features  
- Integration with learning management systems  
- Advanced analytics for tracking learning progress  

<div align="center">
