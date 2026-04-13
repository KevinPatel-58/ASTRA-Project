# ASTRA – Voice-Controlled Task Manager

A modern task management web application that supports voice commands using the Web Speech API. Users can create, update, and manage tasks through both UI and voice interaction.

## 🚀 Live Demo

https://astra-project-topaz.vercel.app

## 🛠 Tech Stack

* React.js
* Supabase (Authentication & Database)
* OneSignal (Push Notifications)
* Web Speech API (Voice Recognition & Synthesis)
* SCSS

## ✨ Features

* 🎤 Voice-based task creation and navigation
* 🔐 Email authentication with verification
* 🔄 Real-time task updates
* 🔔 Push notifications using OneSignal
* 📱 Fully responsive design

## 📦 Installation & Setup

```bash
git clone https://github.com/KevinPatel-58/ASTRA-Project.git
cd ASTRA-Project
npm install
npm start
```

## 🔐 Environment Variables

Create a `.env` file in the root directory and add:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
REACT_APP_BASE_URL=http://localhost:3000
```

## 🧪 How It Works

* Uses Web Speech API for voice recognition and speech synthesis
* Supabase handles authentication and database operations
* OneSignal manages push notifications
* React manages UI and state

## 📁 Project Structure (Simplified)

```
src/
 ├── Components/
 ├── Pages/
 ├── context/
 ├── Hook/
 ├── Services/
 ├── util/
```

## ⚠️ Notes

* Do not expose your `.env` file publicly
* Supabase uses Row Level Security (RLS) to protect data

## 👨‍💻 Author

Kevin Patel

