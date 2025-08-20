import {
    CopilotRuntime,
    copilotRuntimeNextJSAppRouterEndpoint,
    CopilotServiceAdapter,
  } from '@copilotkit/runtime';
  
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

// Custom Lambda API Service Adapter implementing all required methods
class CustomLambdaAdapter implements CopilotServiceAdapter {
  private apiUrl = 'https://7uxm7jk4k3om3llfjjmcfgn6hi0uoovo.lambda-url.us-east-1.on.aws/';
  private apiKey = 'pEr1hFWdiKAUNKzVxxjmQjN2WYJVn3Vs';

  // Main method called by CopilotKit
  async process(forwardedProps: any): Promise<any> {
    console.log('🚀 CustomLambdaAdapter.process() called');
    console.log('📥 Received forwardedProps:', JSON.stringify(forwardedProps, null, 2));
    
    const { messages, model = "gpt-4.1", eventSource, threadId: incomingThreadId } = forwardedProps;
    const threadId = incomingThreadId || randomUUID();
    
    console.log(`📋 Processing ${messages?.length || 0} messages with model: ${model}`);
    
    try {
      // Validate input
      if (!messages || !Array.isArray(messages)) {
        throw new Error('Invalid messages format: expected array');
      }

      // Transform CopilotKit messages to your API format
      const transformedMessages = messages.map((msg: any, index: number) => {
        console.log(`📝 Transforming message ${index + 1}:`, { role: msg.role, contentLength: msg.content?.length || 0 });
        return {
          role: msg.role,
          content: msg.content
        };
      });

      // Prepare request body matching your lambda format
      const requestBody = {
        messages: transformedMessages,
        model: model,
        thinking: {
          type: "enabled",
          budget_tokens: 10000
        },
        organisation_id: 13,
        metadata: {
          source: "copilotkit-integration"
        }
      };

      console.log('🌐 Sending request to Lambda API URL:', this.apiUrl);
      console.log('🔑 Using API key:', `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const startTime = Date.now();
      
      // Make request to your Lambda API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-orca-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      console.log(`⏱️  API request took ${endTime - startTime}ms`);
      console.log('📊 Response status:', response.status, response.statusText);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.text();
      console.log('✅ Lambda API response received');
      console.log('📄 Response length:', responseData.length);
      console.log('📝 Raw response content:', responseData.substring(0, 200) + (responseData.length > 200 ? '...' : ''));

      // Validate response
      if (!responseData || typeof responseData !== 'string') {
        throw new Error('Invalid response: expected non-empty string');
      }

      // Parse JSON response and extract the actual content
      let actualContent = responseData;
      try {
        const parsedResponse = JSON.parse(responseData);
        console.log('🔍 Parsed JSON response:', JSON.stringify(parsedResponse, null, 2));
        
        // Extract the actual content from the "output" field
        if (parsedResponse.output) {
          actualContent = parsedResponse.output;
          console.log('📝 Extracted content from output field:', actualContent);
        } else if (parsedResponse.content) {
          actualContent = parsedResponse.content;
          console.log('📝 Extracted content from content field:', actualContent);
        } else {
          console.log('⚠️  No output or content field found, using raw response');
        }
      } catch (parseError) {
        console.log('⚠️  Response is not JSON, treating as plain text');
      }

      // Stream the response to CopilotKit via the event source
      if (!eventSource) {
        throw new Error('Missing eventSource in forwardedProps');
      }

      console.log('📡 Streaming response to CopilotKit eventSource');
      await eventSource.stream(async (eventStream$: any) => {
        const messageId = randomUUID();
        try {
          eventStream$.sendTextMessageStart({ messageId });
          if (actualContent && typeof actualContent === 'string') {
            eventStream$.sendTextMessageContent({ messageId, content: actualContent });
          }
          eventStream$.sendTextMessageEnd({ messageId });
        } catch (streamError) {
          console.error('❌ Error while streaming to eventSource:', streamError);
          throw streamError;
        } finally {
          eventStream$.complete();
        }
      });

      console.log('✨ CustomLambdaAdapter.process() completed successfully');

      // Return minimal response shape expected by CopilotKit
      return { threadId };

    } catch (error) {
      console.error('💥 Error in CustomLambdaAdapter.process():', error);
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : { message: String(error) };
      console.error('🔍 Error details:', errorDetails);
      
      // Re-throw to let CopilotKit handle it
      throw error;
    }
  }

  // Required method: createChatCompletion
  async createChatCompletion(params: any): Promise<any> {
    console.log('🔧 createChatCompletion called with params:', params);
    return this.process(params);
  }

  // Required method: chatCompletion  
  async chatCompletion(params: any): Promise<any> {
    console.log('🔧 chatCompletion called with params:', params);
    return this.process(params);
  }

  // Required method: streamChatCompletion
  async streamChatCompletion(params: any): Promise<any> {
    console.log('🔧 streamChatCompletion called with params:', params);
    return this.process(params);
  }

  // Required method: listModels
  async listModels(): Promise<any> {
    console.log('🔧 listModels called');
    return {
      data: [
        {
          id: 'gpt-4.1',
          object: 'model',
          created: Date.now(),
          owned_by: 'custom-lambda'
        }
      ]
    };
  }
}

const serviceAdapter = new CustomLambdaAdapter();

const runtime = new CopilotRuntime();

console.log('🔧 CopilotKit Runtime initialized with CustomLambdaAdapter');
 
export const POST = async (req: NextRequest) => {
  console.log('🌐 POST /api/copilotkit endpoint called');
  console.log('📋 Request method:', req.method);
  console.log('🔗 Request URL:', req.url);
  
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/copilotkit',
    });
    
    console.log('⚙️  CopilotKit endpoint handler created');
    console.log('🚀 Delegating to CopilotKit handleRequest...');
    
    const response = await handleRequest(req);
    
    console.log('✅ CopilotKit handleRequest completed');
    console.log('📊 Response status:', response.status);
    
    return response;
  } catch (error) {
    console.error('💥 Error in POST /api/copilotkit:', error);
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { message: String(error) };
    console.error('🔍 Error details:', errorDetails);
    
    // Return a proper error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};