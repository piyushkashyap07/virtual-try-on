# Multi-Angle Virtual Try-On with Gemini 2.5 Flash Image Preview

<div align="center">
  <img width="800" height="400" alt="Virtual Try-On App" src="https://via.placeholder.com/800x400/6366f1/ffffff?text=Multi-Angle+Virtual+Try-On" />
  
  [![Kaggle Nano Banana](https://img.shields.io/badge/Kaggle-Nano%20Banana%20Hackathon-blue)](https://kaggle.com/competitions/banana)
  [![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
  [![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash%20Image%20Preview-green)](https://ai.google.dev/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)](https://mongodb.com/)
</div>

## 🎯 Overview

Revolutionary virtual try-on application that leverages Google's **Gemini 2.5 Flash Image Preview** model to generate realistic multi-angle fashion try-ons. Users can upload garment images and see themselves wearing the clothes from **front, back, and side perspectives** with AI-powered precision.

## ✨ Key Features

- **🔄 Multi-Angle Generation**: Creates front, back, and side views using Gemini 2.5 Flash Image Preview
- **👤 Smart Reference Management**: Saves user reference images for seamless future try-ons
- **🔐 User Authentication**: MongoDB-based user management with try-on history
- **⚡ Real-time Processing**: Fast image generation with loading states
- **📱 Responsive Design**: Modern React UI with Tailwind CSS
- **🎨 Beautiful UI**: Intuitive drag-and-drop interface

## 🚀 Live Demo

[![Demo Video](https://img.shields.io/badge/YouTube-Demo%20Video-red)](https://youtube.com/watch?v=YOUR_VIDEO_ID)

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Local Storage** for user session management

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcrypt
- **CORS** enabled for cross-origin requests

### AI Integration
- **Google Gemini 2.5 Flash Image Preview** API
- **Multi-modal input** (image + text prompts)
- **Base64 image processing**

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance)
- **Google Gemini API Key** ([Get yours here](https://ai.google.dev/))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/piyushkashyap07/virtual-try-on.git
cd virtual-try-on
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
node -e "const fs = require('fs'); const content = 'PORT=5000\nNODE_ENV=development\nMONGODB_URI=mongodb://localhost:27017/virtual-try-on\nJWT_SECRET=your-super-secret-jwt-key-change-in-production\nGEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE\nCORS_ORIGIN=http://localhost:5173'; fs.writeFileSync('.env', content, 'utf8'); console.log('✅ .env file created');"

# Start MongoDB (if running locally)
# Make sure MongoDB is running on localhost:27017

# Start the backend server
npm run dev
# or
node server.js
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/virtual-try-on
JWT_SECRET=your-super-secret-jwt-key-change-in-production
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:5173
```

### MongoDB Setup

**Option 1: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod
```

**Option 2: MongoDB Atlas (Cloud)**
```bash
# Update MONGODB_URI in .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/virtual-try-on
```

## 📱 How to Use

### For New Users
1. **Sign Up** with email and password
2. **Upload Reference Images**:
   - Full-length photo (front view)
   - Passport-size photo (headshot)
3. **Upload Garment Image** you want to try on
4. **Click "Virtual Try-On"** to generate multi-angle results
5. **View Results** in front, back, and side tabs
6. **Download** individual angle results

### For Returning Users
1. **Sign In** to your account
2. **Upload Garment Image** (reference images are saved)
3. **Generate Try-On** - uses your saved reference images automatically
4. **View History** of all previous try-ons

### Guest Users
- Can use the service without account
- Single image generation only
- No history saving

## 🎨 Gemini 2.5 Flash Image Preview Integration

Our application leverages Gemini 2.5 Flash Image Preview's advanced capabilities:

### Multi-Angle Generation
```javascript
// Front view prompt
"Create a realistic virtual try-on showing the person wearing the garment from the FRONT VIEW. Maintain the person's pose, body proportions, and background."

// Back view prompt  
"Create a realistic virtual try-on showing the person wearing the garment from the BACK VIEW. Rotate the person to show their back while maintaining their body proportions."

// Side view prompt
"Create a realistic virtual try-on showing the person wearing the garment from the SIDE VIEW. Show the person in profile while maintaining realistic garment fit."
```

### Key Features Utilized
- **Image Understanding**: Analyzes garment characteristics and fit
- **Contextual Generation**: Creates appropriate poses for each angle
- **Realistic Rendering**: Maintains lighting, shadows, and proportions
- **Multi-modal Processing**: Combines image and text inputs

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/reference-images` - Upload reference images

### Try-On
- `POST /api/tryon/create` - Create virtual try-on
- `GET /api/tryon/history/:userId` - Get user's try-on history

### Health
- `GET /api/health` - API health check

## 🏗️ Project Structure

```
virtual-try-on/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── App.tsx          # Main app component
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js backend
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   │   └── geminiService.js # Gemini API integration
│   ├── middleware/          # Express middleware
│   ├── server.js            # Main server file
│   └── package.json
└── README.md
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### Backend (Railway/Render)
```bash
# Set environment variables in deployment platform
# Deploy backend
# Update CORS_ORIGIN to production URL
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Competition Details

**Kaggle Nano Banana Hackathon 2025**
- **Track**: AI/ML Innovation
- **Focus**: Gemini 2.5 Flash Image Preview Integration
- **Innovation**: Multi-angle virtual try-on generation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/piyushkashyap07/virtual-try-on/issues)
- **Email**: piyushkashyap045@gmail.com
- **LinkedIn**: [Piyush Kashyap](https://linkedin.com/in/piyushkashyap07)

## 🙏 Acknowledgments

- **Google Gemini Team** for the powerful AI model
- **Kaggle** for hosting the Nano Banana hackathon
- **React & Node.js communities** for excellent documentation

---

<div align="center">
  <p>Made with ❤️ for the Kaggle Nano Banana Hackathon 2025</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>