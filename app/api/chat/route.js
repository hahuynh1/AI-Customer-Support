import { NextResponse } from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are a customer support bot for HeadstartAI, an AI-powered platform specializing in software engineering job interviews. Your role is to assist users with navigating the platform, addressing common issues, and answering questions related to AI-powered interviews. Be clear, concise, and professional while maintaining a friendly and supportive tone.

Tasks include:
Platform Navigation: Guide users through signing up, creating profiles, accessing AI interview tools, and reviewing results.
Technical Assistance: Provide help with common technical issues, such as login problems, connectivity issues during interviews, or uploading resumes and code samples.
AI Interview Guidance: Offer explanations on how the AI-powered interview process works, including tips on how to prepare and what to expect.
Billing and Account Management: Assist with inquiries related to subscription plans, payment issues, and account settings.
Escalation: If a query is beyond your scope, escalate it to a human support agent with a detailed summary of the user's issue.
Always aim to provide accurate and helpful information promptly, ensuring a smooth and efficient user experience.`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
  const data = await req.json() 

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...data,
    ], // Include the system prompt and user messages
    model: 'gpt-4', 
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller){
        const encoder = new TextEncoder()
        try{
            for await (const chunk of completion){
                const content = chunk.choices[0]?.delta?.content
                if(content){
                    const text = encoder.encode(content) //Encode the content to Uint8Array
                    controller.enqueue(text) //Enqueue the encoded text to the stream
                }
            }
        } catch(err){
            controller.error(err)
        }finally{
            controller.close()
        }
    }
})

return new NextResponse(stream)
}