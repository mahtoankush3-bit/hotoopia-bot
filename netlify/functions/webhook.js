const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios'); 
const app = express();

app.use(express.json());

// 1. The Verification Door (Keeps Meta happy)
app.get('*', (req, res) => {
  const VERIFY_TOKEN = "hotoopia_secure_webhook_123";
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2. The Auto-Reply Brain
app.post('*', async (req, res) => {
  // Always answer Meta immediately so they know we got the message
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;
    
    // Check if this is an actual Instagram DM
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        for (const messagingEvent of entry.messaging) {
          
          // If someone sent a text message
          if (messagingEvent.message && messagingEvent.message.text) {
            const senderId = messagingEvent.sender.id;
            const messageText = messagingEvent.message.text.toLowerCase();

            // Default reply
            let replyText = "Welcome to Hotoopia! 🎓 Reply with your class (like 'Class 10' or 'Class 12') to get your study materials!";
            
            // Keyword Triggers
            if (messageText.includes("10") || messageText.includes("ten")) {
              replyText = "Here are the links to our Class 10 Study Materials: [INSERT YOUR LINK HERE]";
            } else if (messageText.includes("12") || messageText.includes("twelve")) {
              replyText = "Here are the links to our Class 12 Courses: [INSERT YOUR LINK HERE]";
            } else if (messageText.includes("8") || messageText.includes("9") || messageText.includes("11")) {
                replyText = "We have materials for your class too! Check out our full library here: [INSERT WEBSITE LINK]";
            }

            // Send the reply back through Meta's API using your hidden Netlify password
            await axios({
              method: 'POST',
              url: `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
              data: {
                recipient: { id: senderId },
                message: { text: replyText }
              },
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
});

// The magical exit door for Netlify
module.exports.handler = serverless(app);
