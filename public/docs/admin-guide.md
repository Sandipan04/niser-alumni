# 🛡️ Admin Guide

The Admin Dashboard provides full CRUD (Create, Read, Update, Delete) access to the Cloudflare D1 SQL database and R2 Photo Storage.

## 🔐 Accessing the Dashboard
Click **Admin Access** at the bottom of the sidebar. You must enter the credentials matching the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables set in the Cloudflare dashboard.

## 📋 The Dashboard Tabs

### 1. Pending Queue
Whenever a user fills out the "Join" form, their data arrives here. 
* Click **Approve** to instantly inject their data into the live directory.
* Click **Reject** to permanently delete the request.

### 2. Live Database
This is your active roster. You can:
* **Edit:** Click the blue edit icon to open a modal. You can modify any text field, and even upload a new photo (which will overwrite the old one in R2).
* **Delete:** Click the red trash icon to permanently remove a user.

### 3. Messages
This tab contains all messages submitted via the public "DM Admin" modal. Once you have resolved a request, click the delete icon to remove the message from your inbox.

## 🧹 Storage Cleanup (Garbage Collection)
When a user is deleted, or a request is rejected, their uploaded photo might occasionally be left behind in the R2 bucket. Click the yellow **Cleanup Storage** button in the top navigation bar. This runs a background job that cross-references the SQL database with the R2 bucket and safely deletes any orphaned images to save storage space.