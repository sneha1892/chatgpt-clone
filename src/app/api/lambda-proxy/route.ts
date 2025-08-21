import { NextRequest } from "next/server";

const LAMBDA_URL = "https://7uxm7jk4k3om3llfjjmcfgn6hi0uoovo.lambda-url.us-east-1.on.aws/";
const API_KEY = "pEr1hFWdiKAUNKzVxxjmQjN2WYJVn3Vs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("🚀 Lambda proxy called with body:", body);
  const response = await fetch(LAMBDA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-orca-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });
  
  const text = await response.text();
  console.log("🚀 Lambda proxy response:", text);
  return new Response(text, { 
    status: response.status,
    headers: { "Content-Type": "text/plain" }
  });
}
