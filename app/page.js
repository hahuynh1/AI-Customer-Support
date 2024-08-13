'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi, I am your assistant. How can I assist you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)

    setMessage('')  // Clear the input field
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },  // Add the user's message to the chat
      { role: 'assistant', content: '' },  // Add a placeholder for the assistant's response
    ])

    // Send the message to the server
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    
    await reader.read().then(function processText({ done, value }) {
      if (done) {
        return result;
      }

      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1]; // Get last message (placeholder for chatbot)
        let otherMessages = messages.slice(0, messages.length - 1); // Get all other messages
        return [
          ...otherMessages, // All chat history
          { ...lastMessage, // Most recent message
            content: lastMessage.content + text,
          },
        ]
      });

      return reader.read().then(processText); // Continue reading the next chunk of the response
    });

    setIsLoading(false); // Set loading state to false after the message has been sent and processed
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f5f5f5"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="2px #d1d1d1"
        p={2}
        spacing={2}
        bgcolor="white"
        borderRadius={8} 
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? '#e0e0e0'
                    : '#b0b0b0'
                }
                color="black"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined" // Keep the outline neutral
            InputLabelProps={{
            style: { color: '#888888' }, // Neutral grey for label
            }}
            inputProps={{
              style: { color: '#333333' }, // Dark grey text
          }}
        />
        <Button variant="contained"
          onClick={sendMessage}
          disabled={isLoading}
          style={{
            backgroundColor: 'black',
            color: '#ffffff', 
          }}
        >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
