# Deployment Guide - Live Production Setup

This guide will help you deploy your **Chat-Pat** application to be live on the internet.

## 1. Prerequisites
-   **GitHub Account:** Push your code to a GitHub repository.
-   **Render Account:** For deploying the Backend (Free tier available).
-   **Vercel Account:** For deploying the Frontend (Free).
-   **Google App Password:** For Email Verification (see previous section).

---

## 2. Deploy Backend (Node.js/Express) on Render

1.  Login to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings:**
    -   **Name:** `chat-pat-backend` (or similar)
    -   **Region:** Choose closest to you (e.g., Singapore, Frankfurt)
    -   **Branch:** `main`
    -   **Root Directory:** `backend` (Important!)
    -   **Runtime:** `Node`
    -   **Build Command:** `npm install`
    -   **Start Command:** `npm start`
5.  **Environment Variables (Advanced):** Click "Add Environment Variable" for each:

    | Key | Value |
    | :--- | :--- |
    | `NODE_ENV` | `production` |
    | `MONGO_URI` | `your_mongodb_connection_string` |
    | `JWT_SECRET` | `your_complex_secret` |
    | `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` |
    | `CLOUDINARY_API_KEY` | `your_api_key` |
    | `CLOUDINARY_API_SECRET` | `your_api_secret` |
    | `EMAIL_USER` | `your.email@gmail.com` |
    | `EMAIL_PASS` | `your_app_password` |
    | `FRONTEND_URL` | `https://your-frontend-app.vercel.app` (You will get this after deploying frontend, come back and update it!) |

6.  Click **Create Web Service**. Wait for the build to finish.
7.  **Copy your Backend URL** (e.g., `https://chat-pat-backend.onrender.com`).

---

## 3. Deploy Frontend (React) on Vercel

1.  Login to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Configure Project:**
    -   **Framework Preset:** `Create React App`
    -   **Root Directory:** `frontend` (Important! Click Edit and select the `frontend` folder).
5.  **Environment Variables:**
    -   **Key:** `REACT_APP_API_URL`
    -   **Value:** `https://chat-pat-backend.onrender.com` (The backend URL you just validated).
6.  Click **Deploy**.

---

## 4. Final Connection Step

1.  Once Vercel finishes, you will get a **Frontend Domain** (e.g., `https://chat-pat-frontend.vercel.app`).
2.  Go back to **Render (Backend) Dashboard** -> **Environment**.
3.  Update (or Add) the `FRONTEND_URL` variable:
    -   `FRONTEND_URL`: `https://chat-pat-frontend.vercel.app`
4.  **Redeploy** the Backend (Manual Deploy -> Deploy latest commit) so it picks up the new CORS origin.

## 5. Verification
-   Open your Vercel URL.
-   Try `Sign Up` (Check if Email OTP works).
-   Try `Login`.
-   Open the app on two different devices/browsers and test **Real-time Chat** and **Video Call**.

---

## Troubleshooting
-   **CORS Error?** Check if `FRONTEND_URL` in Backend matches the Vercel URL exactly (no trailing slash).
-   **Socket Error?** Ensure `REACT_APP_API_URL` in Frontend matches the Render URL (no trailing slash).
-   **Camera Issue?** Ensure you are testing on `https` (Vercel provides this by default). Browsers block camera on `http`.
