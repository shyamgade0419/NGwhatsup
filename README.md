# NG WhatsApp Gateway

The WhatsApp gateway behind **NG by NovaGade**. NG Home uses it to send bill, reminder, late-fine and payment
messages to residents over WhatsApp.

It is a self-hosted service with an HTTP API and a small web dashboard (sign in with the API key). NG Home talks to it
from the Platform console: **Settings → WhatsApp messages**, where you enter this gateway's address and key and link the
phone by scanning a QR code.

## Run it on Coolify

1. In Coolify: **+ New → Resource → Git Repository (with GitHub App)**, pick this repository and the `main` branch.
2. **Build Pack:** Docker Compose. **Docker Compose Location:** `/docker-compose.coolify.yml`.
3. **Environment Variables:** set `NG_WA_API_KEY` to a long random secret (40+ characters). This is the key you enter in
   NG Home. Do not use the Lock option, so you can read it again later.
4. **Domains:** give the `ng-whatsapp` service your address with the port, for example `https://nghome-wa.novagade.in:2785`.
   In Cloudflare keep that record on **DNS only** (grey cloud).
5. Deploy. Open the address in a browser and sign in with the key to see the dashboard.

The `ng-whatsapp-data` volume holds the WhatsApp link and the database. Keep it: deleting it means scanning the QR code again.

## Notes

- This gateway is for one-to-one **invoices, reminders and OTPs only**, never marketing. `DISABLE_BROADCAST_SENDING=true`
  (set in `docker-compose.coolify.yml`) makes the gateway refuse bulk sends and status posts with HTTP 403
  `BROADCAST_SENDING_DISABLED`. Single sends (`send-text`, `send-document`, `send-template`) still work.
- Use a **dedicated** WhatsApp number, not a personal one. WhatsApp can restrict numbers used for automation, so NG Home
  sends slowly (one message every few seconds, daytime only) and the gateway paces new numbers (`SEND_PACING_ENABLED`).
- A linked phone stays linked across restarts and redeploys while the data volume is kept and the phone is used or online
  at least every couple of weeks.
- Updating: change the code here, push to `main`, and redeploy in Coolify.

## Licence

This software is released under the MIT licence; see [LICENSE](./LICENSE). The licence notice must stay with the source.
