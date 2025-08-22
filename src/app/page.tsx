"use client";

import { useState, useEffect, useCallback } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "./style.css";
import { useCopilotMessagesContext } from "@copilotkit/react-core";
import { ActionExecutionMessage, ResultMessage, TextMessage } from "@copilotkit/runtime-client-gql";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { useCopilotAction } from "@copilotkit/react-core";

function generateUniqueThreadId() {
  return uuidv4();
}

export default function Home() {
  const [currentThreadId, setCurrentThreadId] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const { messages, setMessages } = useCopilotMessagesContext();
  const [availableThreads, setAvailableThreads] = useState<string[]>([]); // State for the list of threads
  
  // --- NEW: Function to get thread name from content ---
  const getThreadName = useCallback((threadId: string): string => {
    if (!isClient) return threadId.substring(0, 8) + "...";
    
    try {
      const storedMessagesJSON = localStorage.getItem(`copilotkit-messages-${threadId}`);
      if (storedMessagesJSON) {
        const messages = JSON.parse(storedMessagesJSON);
        // Find the first user message
        const firstUserMessage = messages.find((msg: any) => 
          msg.type === "TextMessage" && msg.role === "user" && msg.content
        );
        
        if (firstUserMessage && firstUserMessage.content) {
          const content = firstUserMessage.content.trim();
          // Truncate to 35 characters and add ellipsis if longer
          return content.length > 35 ? content.substring(0, 35) + "..." : content;
        }
      }
    } catch (error) {
      console.error('Error getting thread name:', error);
    }
    
    // Fallback to ID format
    return threadId.substring(0, 8) + "...";
  }, [isClient]);

  // --- REVISED: Function to start a new thread (moved up) ---
  const startNewThread = useCallback(() => {
    if (!isClient) return;

    const newId = generateUniqueThreadId();
    setCurrentThreadId(newId);

    // Immediately clear messages for the new thread to ensure a fresh start
    setMessages([]);
    setAvailableThreads(prev => [...prev, newId]);
    localStorage.setItem(`copilotkit-messages-${newId}`, JSON.stringify([]));

  }, [isClient, setMessages]);

  // --- NEW: Function to switch to an existing thread ---
  const selectThread = useCallback((id: string) => {
    if (!isClient) return;
    
    // Set the new thread ID
    setCurrentThreadId(id);
    
    // Load messages for the new thread immediately
    const storedMessagesJSON = localStorage.getItem(`copilotkit-messages-${id}`);
    
    if (storedMessagesJSON) {
      try {
        const parsedMessages = JSON.parse(storedMessagesJSON).map((message: any) => {
          if (message.type === "TextMessage") {
            return new TextMessage({ id: message.id, role: message.role, content: message.content, createdAt: message.createdAt });
          } else if (message.type === "ActionExecutionMessage") {
            return new ActionExecutionMessage({ id: message.id, name: message.name, scope: message.scope, arguments: message.arguments, createdAt: message.createdAt });
          } else if (message.type === "ResultMessage") {
            return new ResultMessage({ id: message.id, actionExecutionId: message.actionExecutionId, actionName: message.actionName, result: message.result, createdAt: message.createdAt });
          } else {
            throw new Error(`Unknown message type: ${message.type}`);
          }
        });
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing stored messages on thread switch:', error);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [isClient, setMessages]);

  // --- REVISED: Function to delete a thread ---
  const deleteThread = useCallback((threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the thread selection
    
    if (!isClient) return;
    
    // If deleting the current thread, switch to another thread
    if (threadId === currentThreadId) {
      const remainingThreads = availableThreads.filter(id => id !== threadId);
      
      if (remainingThreads.length > 0) {
        // Switch to the most recent thread (last in the list)
        const nextThreadId = remainingThreads[remainingThreads.length - 1];
        selectThread(nextThreadId);
      } else {
        // If no threads left, start a new one
        startNewThread();
      }
    }
    
    // Remove from localStorage
    localStorage.removeItem(`copilotkit-messages-${threadId}`);
    
    // Update available threads list
    setAvailableThreads(prev => prev.filter(id => id !== threadId));
    
    // If this was the last active thread, clear the saved ID
    const lastActiveId = localStorage.getItem("lastActiveCopilotThreadId");
    if (lastActiveId === threadId) {
      localStorage.removeItem("lastActiveCopilotThreadId");
    }
  }, [currentThreadId, isClient, availableThreads, selectThread, startNewThread]);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    const savedId = localStorage.getItem("lastActiveCopilotThreadId");
    const idToUse = savedId || generateUniqueThreadId();
    setCurrentThreadId(idToUse);

  // Load messages right after setting the thread ID
    const storedMessagesJSON = localStorage.getItem(`copilotkit-messages-${idToUse}`);
    if (storedMessagesJSON) {
      try {
        const parsedMessages = JSON.parse(storedMessagesJSON).map((message: any) => {
          // Re-instantiate messages as before
          if (message.type === "TextMessage") {
            return new TextMessage({ id: message.id, role: message.role, content: message.content, createdAt: message.createdAt });
          } else if (message.type === "ActionExecutionMessage") {
            return new ActionExecutionMessage({ id: message.id, name: message.name, scope: message.scope, arguments: message.arguments, createdAt: message.createdAt });
          } else if (message.type === "ResultMessage") {
            return new ResultMessage({ id: message.id, actionExecutionId: message.actionExecutionId, actionName: message.actionName, result: message.result, createdAt: message.createdAt });
          } else {
            throw new Error(`Unknown message type: ${message.type}`);
          }
        });
        setMessages(parsedMessages);
        } catch (error) {
            console.error('Error parsing stored messages on initial load:', error);
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }, [setMessages]); // setMessages is a stable function provided by the context, so this runs once on mount

       // --- NEW: Effect to load ALL thread IDs for the sidebar ---
    useEffect(() => {
      if (!isClient) return; // Only run on the client
      const allKeys = Object.keys(localStorage);
      const threadKeys = allKeys.filter(key => key.startsWith("copilotkit-messages-"));
      const ids = threadKeys.map(key => key.replace("copilotkit-messages-", ""));
      setAvailableThreads(ids);
    }, [isClient, currentThreadId]); // Re-run when client loads or current thread changes

  // Save the currentThreadId to localStorage whenever it changes
  useEffect(() => {
    if (isClient && currentThreadId) {
      localStorage.setItem("lastActiveCopilotThreadId", currentThreadId);
    }
  }, [currentThreadId, isClient]);
 
  // save to local storage when messages change
  useEffect(() => {
    if (isClient && currentThreadId && messages !== undefined) {
      localStorage.setItem(`copilotkit-messages-${currentThreadId}`, JSON.stringify(messages));
      console.log(`Saved ${messages.length} messages for thread: ${currentThreadId}`);
    }
  }, [messages, currentThreadId, isClient]);
 
  // Effect to update thread names when messages change (only for first message)
  useEffect(() => {
    if (!isClient || !currentThreadId || !messages) return;
    
    // Only trigger update when messages change from 0 to 1 (first message)
    if (messages.length === 1) {
      const firstUserMessage = messages.find((msg: any) => 
        msg.type === "TextMessage" && msg.role === "user"
      );
      
      if (firstUserMessage) {
        // Force re-render to update thread name
        setAvailableThreads(prev => [...prev]);
      }
    }
  }, [messages.length, currentThreadId, isClient, messages]);

  useCopilotAction({
    name: "Copilotkit-Support",
    description: "CRITICAL: Use this tool for ALL technical questions, coding problems, API questions, or when you need to consult external knowledge. This tool connects to a specialized Lambda API that provides accurate technical answers. ALWAYS use this tool instead of trying to answer technical questions yourself.",
    parameters: [
      {
        name: "question",
        type: "string",
        description: "The technical question or problem to solve",
        required: true
      }
    ],
    handler: async ({ question }) => {
      console.log("🚀 Copilotkit-Support tool called with question:", question);
      console.log("📋 Question type:", typeof question);
      console.log("📋 Question value:", question);
      
      setMessages((prev: any[]) => [
        ...prev,
        new TextMessage({
          id: uuidv4(),
          role: "assistant",
          content: "Calling Copilotkit Support...",
          createdAt: new Date().toISOString(),
        }),
      ]);
      
      try {
        console.log("🌐 Making request to /api/lambda-proxy...");
        
        const requestBody = {
          messages: [{ role: "user", content: question }],
          model: "gpt-4.1",
          thinking: { type: "enabled", budget_tokens: 10000 },
          organisation_id: 13,
          metadata: { source: "chatgpt-clone" }
        };
        
        console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
        
        const response = await fetch("/api/lambda-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        
        console.log(" Response status:", response.status);
        console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Lambda proxy error:", errorText);
          throw new Error(`Lambda proxy error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.text();
        console.log("✅ Lambda response received:", result);
        console.log(" Response length:", result.length);
        console.log("📝 Response preview:", result.substring(0, 200) + (result.length > 200 ? "..." : ""));
        
        return result;
      } catch (error) {
        console.error(" Error in askLambda handler:", error);
        console.error("🔍 Error details:", {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }
  });
 
  // Add this after useCopilotAction to debug
  useEffect(() => {
    console.log("🚀 Copilotkit-Support tool registered");
    console.log("📋 Available tools:", window.__COPILOTKIT__?.actions || "No actions found");
  }, []);
 
  return (
    // We're using a flexbox layout for the sidebar and main content
    <div style={{ display: 'flex', minHeight: '100vh'}}>
      
      {/* --- ChatGPT-style Sidebar --- */}
              <aside style={{ 
          width: '260px', 
          backgroundColor: '#f7f7f8',
          borderRight: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
        
        {/* Top Section - Logo and New Chat Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: '#10a37f', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '0.75rem'
            }}>
              <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>T</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Todo Assistant</span>
          </div>
          
          <button 
            onClick={startNewThread} 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              backgroundColor: '#10a37f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            New Chat
          </button>
        </div>

        {/* Middle Section - Search */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'white', 
            border: '1px solid #e5e5e5', 
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            gap: '0.5rem'
          }}>
            <span style={{ color: '#666', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search chats..." 
              style={{ 
                border: 'none', 
                outline: 'none', 
                flex: 1, 
                fontSize: '0.9rem',
                backgroundColor: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Threads Section */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: '#666', 
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Recent Chats
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {availableThreads.map(id => (
              <div 
                key={id} 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative'
                }}
              >
                <button 
                  onClick={() => selectThread(id)} 
                  style={{ 
                    flex: 1,
                    padding: '0.75rem 1rem', 
                    backgroundColor: id === currentThreadId ? '#f0f0f0' : 'transparent', 
                    border: 'none', 
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = id === currentThreadId ? '#f0f0f0' : '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = id === currentThreadId ? '#f0f0f0' : 'transparent'}
                >
                  <span style={{ fontSize: '14px' }}>💬</span>
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {getThreadName(id)}
                  </span>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => deleteThread(id, e)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = '#ff4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.color = '#666';
                  }}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - User Profile */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: '#10a37f', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>S</span>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Sneha</span>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Current Thread ID: {isClient ? currentThreadId : "Loading..."}
          </p>
        </div>
        
        {/* Chat container */}
        <div className="flex-1 flex flex-col relative">
          {isClient && currentThreadId && (
            <div className="absolute inset-0 p-4">
              <CopilotChat
                imageUploadsEnabled={true}
                inputFileAccept="image/png,image/jpeg"
                key={currentThreadId}
                instructions="You are a helpful assistant. CRITICAL INSTRUCTION: You have access to a 'Copilotkit-Support' tool that provides accurate technical answers. You MUST use this tool for ANY technical question, coding problem, or when you need external knowledge. Never try to answer technical questions without using this tool first."
                labels={{
                  title: "Todo Assistant",
                  initial: "Hi! How I can help you today? I have access to technical support tools when you need them.",
                }}
                className="h-full w-full rounded-lg"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}