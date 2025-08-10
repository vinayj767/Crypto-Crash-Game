#!/bin/bash

# Crypto Crash Game - Quick Start Script
echo "🚀 Starting Crypto Crash Game..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running (for local development)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't seem to be running locally."
    echo "   Make sure MongoDB is running or use MongoDB Atlas."
    echo "   Update the MONGODB_URI in backend/env file."
fi

# Start backend
echo "📦 Starting backend server..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

# Check if environment file exists
if [ ! -f "env" ]; then
    echo "📝 Creating environment file..."
    cp env.example env
    echo "   ✏️  Please edit backend/env with your MongoDB URI"
fi

# Start backend in background
echo "🔙 Starting backend on port 3000..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🖥️  Starting frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Check if environment file exists
if [ ! -f "env" ]; then
    echo "📝 Creating frontend environment file..."
    cp env.example env
fi

# Start frontend
echo "🌐 Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

# Wait a bit for servers to fully start
sleep 3

echo ""
echo "✅ Crypto Crash Game is starting up!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔙 Backend:  http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api/info"
echo ""
echo "🎮 Demo Players:"
echo "   • alice_crypto"
echo "   • bob_trader" 
echo "   • charlie_whale"
echo "   • diana_lucky"
echo "   • eve_gamer"
echo ""
echo "⏹️  To stop servers: Ctrl+C or run 'pkill -f npm'"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait

