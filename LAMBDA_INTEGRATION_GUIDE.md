# Lambda API Integration Guide

## 🎯 Overview

This guide explains how your ChatGPT clone has been integrated with your custom Lambda API, replacing the OpenAI integration while maintaining all existing functionality.

## 🔄 What Changed

### Before (OpenAI Integration)
```
User Input → CopilotKit UI → OpenAIAdapter → OpenAI API → Response → UI
```

### After (Custom Lambda Integration)
```
User Input → CopilotKit UI → OpenAIAdapter → Lambda Proxy → Your Lambda API → Response → UI
```

## 📁 Files Modified

### `/src/app/api/copilotkit/route.ts`
- **Updated**: Uses `OpenAIAdapter` with custom OpenAI client pointing to proxy
- **Added**: OpenAI client configuration with custom baseURL

### `/src/app/api/lambda-proxy/route.ts` (NEW)
- **Added**: Proxy endpoint that transforms OpenAI format ↔ Lambda format
- **Handles**: Request/response transformation and authentication

### `package.json`
- **Added**: `openai` package dependency

## 🔧 Integration Details

### API Configuration
- **URL**: `https://7uxm7jk4k3om3llfjjmcfgn6hi0uoovo.lambda-url.us-east-1.on.aws/`
- **Authentication**: `x-orca-api-key: pEr1hFWdiKAUNKzVxxjmQjN2WYJVn3Vs`
- **Model**: `gpt-4.1`
- **Response Format**: Plain text (no JSON wrapper)

### Request Format to Lambda
```json
{
  "messages": [
    {
      "role": "user",
      "content": "User message content"
    }
  ],
  "model": "gpt-4.1",
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  },
  "organisation_id": 13,
  "metadata": {
    "source": "copilotkit-integration"
  }
}
```

### Response Transformation
Your Lambda returns plain text, which gets transformed to CopilotKit format:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Your Lambda's text response"
      }
    }
  ]
}
```

## 📊 Logging & Debugging

The integration includes comprehensive logging with emojis for easy identification:

- 🚀 **Process start**: When CustomLambdaAdapter.process() is called
- 📥 **Input validation**: Received messages and parameters
- 📝 **Message transformation**: Converting CopilotKit to Lambda format
- 🌐 **API request**: URL, headers, and request body
- ⏱️ **Performance**: Request timing
- 📊 **Response details**: Status, headers, content length
- ✅ **Success**: Successful API response
- 🔄 **Transformation**: Response converted back to CopilotKit format
- ✨ **Completion**: Process completed successfully
- 💥 **Errors**: Any failures with detailed error information

## 🧪 Testing

### Manual Testing
1. Run `npm run dev` to start the development server
2. Open the chat interface
3. Send a message
4. Check browser console and terminal for detailed logs

### Automated Testing
Run the test script to verify Lambda API connectivity:
```bash
node test-lambda-integration.js
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check Lambda URL accessibility
   - Verify API key is correct
   - Ensure Lambda function is running

2. **Response Format Issues**
   - Lambda should return plain text, not JSON
   - Check Lambda logs for any errors

3. **Authentication Problems**
   - Verify `x-orca-api-key` header is being sent
   - Check if API key has proper permissions

### Debug Logs Location
- **Browser Console**: Client-side CopilotKit logs
- **Terminal/Server Logs**: CustomLambdaAdapter logs with emoji prefixes

## ✅ Features Preserved

All existing functionality remains intact:
- ✅ Thread management and switching
- ✅ Message persistence in localStorage
- ✅ Sidebar with chat history
- ✅ Thread deletion and creation
- ✅ Responsive UI design
- ✅ Message formatting and display
- ✅ Error handling and recovery

## 🚀 Next Steps

1. **Test the integration** by running the app and sending messages
2. **Monitor logs** for any issues during real usage
3. **Optimize performance** based on response times
4. **Handle edge cases** that may arise during usage

## 📞 Support

If you encounter any issues:
1. Check the console logs for detailed error information
2. Run the test script to verify Lambda connectivity
3. Review Lambda function logs for server-side issues
4. Ensure all configuration values match your Lambda setup
