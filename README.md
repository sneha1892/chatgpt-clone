# ChatGPT Clone

A modern, feature-rich ChatGPT clone built with Next.js, React 19, and CopilotKit. This application provides an AI chat interface with advanced capabilities including Lambda integration and real-time responses.

## 🚀 Features

- **Modern UI/UX**: Built with React 19 and Tailwind CSS for a beautiful, responsive interface
- **AI Chat Interface**: Powered by CopilotKit for intelligent conversations
- **Lambda Integration**: AWS Lambda proxy for scalable backend processing
- **Real-time Responses**: Fast, streaming chat responses
- **TypeScript**: Full TypeScript support for better development experience
- **ESLint**: Code quality and consistency with ESLint configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: CopilotKit
- **Backend**: AWS Lambda (via proxy)
- **Development**: ESLint, Turbopack

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- AWS Lambda function (for backend processing)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd chatgpt-clone
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# AWS Lambda Configuration
LAMBDA_URL=your_lambda_function_url
API_KEY=your_api_key

# Other environment variables as needed
```

### 4. Run the development server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
chatgpt-clone/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── copilotkit/     # CopilotKit API routes
│   │   │   └── lambda-proxy/   # AWS Lambda proxy
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page
│   └── ...
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🚀 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

##  Configuration

### Lambda Proxy
The application includes a Lambda proxy that forwards requests to AWS Lambda functions. Configure your Lambda function URL and API key in the environment variables.

### CopilotKit
CopilotKit is configured to provide AI chat capabilities. Ensure your CopilotKit configuration is properly set up.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Docker containers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

If you encounter any issues or have questions:
- Check the [Issues](https://github.com/yourusername/chatgpt-clone/issues) page
- Create a new issue with detailed information
- Contact the development team

##  Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI capabilities powered by [CopilotKit](https://github.com/CopilotKit/CopilotKit)
- Styling with [Tailwind CSS](https://tailwindcss.com/)