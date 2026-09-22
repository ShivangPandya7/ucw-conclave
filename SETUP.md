# UpperCrust Wealth Conclave — Setup & Deploy

This replaces the Gemini-generated preview with a real, standalone site anyone
can open in a normal browser — no Gemini required.

## What's in here
- `index.html` — landing/intro page (event overview, CTA to register)
- `register.html` — registration form (prospective guests only)
- `assets/gold-scene.js` — the interactive 3D gold coins/bars background (touch to flip, gyroscope tilt on mobile)
- `assets/styles.css` — shared styling
- `assets/ucw-logo.png` — your logo
- `apps-script/Code.gs` — backend that saves submissions into a Google Sheet (your "database")

## 1. Set up the database (Google Sheet, ~5 minutes)
1. Create a new Google Sheet, e.g. **"UCW Conclave Registrations"**.
2. Extensions > Apps Script.
3. Delete the placeholder code, paste in the contents of `apps-script/Code.gs`.
4. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click Deploy, authorize the script (it's your own script, this is safe), and copy
   the **Web app URL** (ends in `/exec`).
6. Back in the Sheet, a tab called **Registrations** will appear automatically the
   first time someone submits the form, with columns including a **Status** column
   (defaults to `Pending Review`) — this is where you'll mark Invite / Hold / Decline
   once you give me the filter parameters.

## 2. Connect the form to the database
1. Open `register.html`.
2. Find this line near the bottom:
   ```js
   const ENDPOINT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
3. Replace the placeholder with the Web app URL from step 1.6.
4. Save.

## 3. Test it locally
Just double-click `index.html` to open it in a browser, click through to
Register, submit a test entry, and confirm a row appears in the Google Sheet.
(On desktop, the "gyroscope" tilt is simulated by mouse movement — the real
gyroscope only activates on a phone.)

## 4. Put it on a real, shareable link (no Gemini needed)
Pick whichever is easiest for you — all are free for a static site like this:

**Option A — Netlify Drop (fastest, zero setup)**
1. Go to https://app.netlify.com/drop
2. Drag the whole `site` folder onto the page.
3. You get an instant public URL (e.g. `ucw-conclave.netlify.app`). You can later
   attach a custom domain like `conclave.uppercrustwealth.com` for free in Netlify's
   domain settings, once you point a DNS record at it.

**Option B — Your existing uppercrustwealth.com hosting**
If you already have hosting/cPanel for your domain, just upload the `site` folder
contents to a subfolder or subdomain (e.g. `uppercrustwealth.com/conclave` or
`conclave.uppercrustwealth.com`) via FTP or the hosting file manager.

**Option C — Vercel / GitHub Pages**
Same idea as Netlify — push this folder to a GitHub repo and connect it, or use
the Vercel CLI (`vercel deploy`) from inside the `site` folder.

Whatever URL you land on, that's the link you send to prospects directly by
SMS/WhatsApp/email — it opens in any phone's normal browser, nothing extra to install.

## 5. What happens after someone submits
- They see: *"Your application has been received... this is not a confirmed
  reservation."* — no auto-confirmation happens anywhere in this flow.
- The submission lands as a new row in your Google Sheet with **Status = Pending Review**.
- You review manually and change Status to whatever you decide (e.g. Invite / Hold / Decline).
- Sending the actual invite is still a separate step you do yourselves — this site
  does not send any invitation emails.

## Still open / needs your input
- **Filter parameters**: once you give me the criteria you'll use to decide who
  gets an invite, I can add matching fields to the form (e.g. AUM range, sector,
  investment interest) and/or a simple scoring view in the Sheet.
- **Event details**: date, venue, and confirmed speaker names are placeholders in
  `index.html` (search for "to be announced") — send them over and I'll fill them in.
- **Domain**: tell me which of the hosting options above you want and, if you
  have domain/DNS access, I can give you the exact records to add.
