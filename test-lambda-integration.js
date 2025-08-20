#!/usr/bin/env node

/**
 * Test script to verify Lambda API integration
 * This simulates what CopilotKit will send to your custom adapter
 */

const API_URL = 'https://7uxm7jk4k3om3llfjjmcfgn6hi0uoovo.lambda-url.us-east-1.on.aws/';
const API_KEY = 'pEr1hFWdiKAUNKzVxxjmQjN2WYJVn3Vs';

async function testLambdaIntegration() {
  console.log('🧪 Testing Lambda API Integration...\n');
  
  // Simulate a typical CopilotKit message exchange
  const testMessages = [
    {
      role: 'user',
      content: 'Hello, can you help me with a simple task?'
    }
  ];

  const requestBody = {
    messages: testMessages,
    model: 'gpt-4.1',
    thinking: {
      type: 'enabled',
      budget_tokens: 10000
    },
    organisation_id: 13,
    metadata: {
      source: 'test-integration'
    }
  };

  console.log('📤 Sending test request to Lambda API:');
  console.log('🌐 URL:', API_URL);
  console.log('🔑 API Key:', `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\n⏳ Making request...\n');

  try {
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-orca-api-key': API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    
    console.log(`⏱️  Request took ${endTime - startTime}ms`);
    console.log('📊 Response status:', response.status, response.statusText);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();
    
    console.log('\n✅ Success! Lambda API responded:');
    console.log('📄 Response length:', responseData.length);
    console.log('📝 Response content:');
    console.log('─'.repeat(50));
    console.log(responseData);
    console.log('─'.repeat(50));

    // Parse JSON response and extract content (matching our adapter logic)
    let actualContent = responseData;
    try {
      const parsedResponse = JSON.parse(responseData);
      console.log('🔍 Parsed JSON response:', JSON.stringify(parsedResponse, null, 2));
      
      if (parsedResponse.output) {
        actualContent = parsedResponse.output;
        console.log('📝 Extracted content from output field:', actualContent);
      } else if (parsedResponse.content) {
        actualContent = parsedResponse.content;
        console.log('📝 Extracted content from content field:', actualContent);
      }
    } catch (parseError) {
      console.log('⚠️  Response is not JSON, treating as plain text');
    }

    // Simulate how CopilotKit will process this (matching our adapter format)
    const copilotResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: actualContent
        },
        finish_reason: 'stop'
      }],
      model: 'gpt-4.1',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    console.log('\n🔄 CopilotKit compatible response:');
    console.log(JSON.stringify(copilotResponse, null, 2));

    console.log('\n🎉 Integration test PASSED!');
    console.log('✅ Your Lambda API is compatible with the CopilotKit frontend');
    
    return true;

  } catch (error) {
    console.error('\n💥 Integration test FAILED:');
    console.error('❌ Error:', error.message);
    console.error('🔍 Full error:', error);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if the Lambda API is running and accessible');
    console.log('2. Verify the API key is correct');
    console.log('3. Ensure the request format matches your Lambda expectations');
    console.log('4. Check Lambda logs for any server-side errors');
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testLambdaIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testLambdaIntegration };
