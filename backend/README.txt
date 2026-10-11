VIVAH RENTAL SHOWROOM - HOW TO RUN
===================================
1. Install Node.js (LTS) from https://nodejs.org  (one time, keep default options).
2. Double-click start.bat. The website opens at http://localhost:3000/
3. First start only: the Owner password is created for you. It is shown in the black
   window and saved in backend\data\OWNER-LOGIN.txt.
4. Owner panel: click "Owner Login" in the website footer (or go to /owner/).
   Sign in, then open Settings & backup > Owner account and set your own password.

No "npm install" is needed - the backend has zero dependencies.

FOLDERS
  frontend\   the website + owner panel (images are in frontend\images)
  backend\    server.js + data\  (data\db.json holds ALL content, bookings, customers)
Back up backend\data and frontend\images regularly
(the owner panel also has Settings > Download backup).

GOING LIVE ON THE INTERNET
  - Run start.bat on a Windows PC/server that stays on, open the port in the firewall
    and point your domain at it (or put it behind IIS / nginx / Cloudflare Tunnel for HTTPS).
  - With HTTPS, set the environment variable SECURE_COOKIES=1 before starting.
  - Change PORT at the top of start.bat if you do not want 3000.
  - Enter your site address in Settings > "Your website address" (sitemap, sharing).

PAYMENTS
  - Razorpay (UPI/cards/netbanking): add your own keys in Payment & booking settings.
  - UPI by reference number and "pay at showroom" work without any gateway.

OWNER LOGIN
  Address:   http://localhost:3000/owner/   (or click "Owner Login" in the website footer)
  Username:  owner
  Password:  created automatically on the first start. It is printed in the black window and
             saved in backend\data\OWNER-LOGIN.txt. Change it in Settings & backup > Owner account.
  Forgot it? Close the black window (stop the website), open a Command Prompt in this folder and run
             node backend\reset-owner.js
             then start the website again. A new password is printed and saved. Nothing else is changed.
