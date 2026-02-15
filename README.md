# Chat-Pat 

A feature-rich, real-time messaging application inspired by WhatsApp. Built with the MERN stack, this project supports real-time text messaging, video calls, media sharing, and secure user authentication.

## 🚀 Features

-   **User Authentication**: Secure signup and login using JWT.
-   **Real-time Messaging**: Instant messaging powered by Socket.io.
-   **Video Calls**: High-quality one-on-one video calling using WebRTC and Socket.io.
-   **Media Sharing**: Send images and videos in chats.
-   **Online Status**: Real-time user online/offline status and last seen.
-   **Read Receipts**: Message delivery and read status indicators.
-   **OTP Verification**: Phone number verification using Twilio and Email verification using Nodemailer.
-   **Responsive Design**: Fully responsive UI built with Tailwind CSS.
-   **Theme Support**: Light and Dark mode support.
-   **Search**: Search for contacts and start new conversations.

## 🛠️ Tech Stack

**Frontend:**
-   **React.js**: UI library for building the interface.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Zustand**: State management.
-   **Socket.io-client**: Real-time bidirectional event-based communication.
-   **Framer Motion**: For smooth animations.
-   **React Router**: Navigation and routing.

**Backend:**
-   **Node.js & Express.js**: RESTful API and server.
-   **MongoDB & Mongoose**: NoSQL database and object modeling.
-   **Socket.io**: Real-time engine for chat and video calls.
-   **JWT (JSON Web Tokens)**: Secure user authentication.
-   **Cloudinary**: Cloud storage for media uploads.
-   **Twilio**: SMS/OTP services.
-   **Nodemailer**: Email sending services.

## 📂 Project Structure

```
whatt-clone/
├── backend/                # Node.js/Express Backend
│   ├── config/             # Configuration files (DB, Cloudinary)
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Services (Socket, Email, Twilio)
│   ├── utils/              # Utility functions
│   └── index.js            # Entry point
│
├── frontend/               # React Frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages (Chat, Login, etc.)
│   │   ├── services/       # API and Socket services
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Helper functions
│   └── package.json        # Frontend dependencies
│
└── README.md               # Project Documentation
```

## 🔧 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/whatt-clone.git
    cd whatt-clone
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    ```
    -   Create a `.env` file in the `backend` directory and add your credentials:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret
        CLOUDINARY_CLOUD_NAME=your_cloud_name
        CLOUDINARY_API_KEY=your_api_key
        CLOUDINARY_API_SECRET=your_api_secret
        TWILIO_ACCOUNT_SID=your_twilio_sid
        TWILIO_AUTH_TOKEN=your_twilio_token
        TWILIO_SERVICE_SID=your_twilio_service_sid
        EMAIL_USER=your_email@gmail.com
        EMAIL_PASS=your_email_password
        ```
    -   Start the server:
        ```bash
        npm start
        ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    ```
    -   Start the React app:
        ```bash
        npm start
        ```

## 🚀 Deployment & Production

For production deployment, we recommend using **Email Verification** instead of Twilio trial accounts.
👉 **[Read the Deployment Guide](DEPLOYMENT.md)** for detailed instructions on setting up free Email Authentication.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
