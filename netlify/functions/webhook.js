const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. Verification Door
app.get('*', (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === "hotoopia_secure_webhook_123") {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  return res.sendStatus(403);
});

// 2. Diagnostic Brain
app.post('*', async (req, res) => {
  // Tell Meta we got the message
  res.status(200).send("EVENT_RECEIVED");

  // Print the EXACT message data to the Netlify logs
  console.log("META SENT THIS:", JSON.stringify(req.body, null, 2));

  try {
    const body = req.body;
    // Allow both "instagram" and "page" objects
    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry) {
        for (const messagingEvent of (entry.messaging || [])) {
          if (messagingEvent.message && messagingEvent.message.text) {
            const senderId = messagingEvent.sender.id;
            
            // Try to send a simple test reply
            await axios({
              method: 'POST',
              url: `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
              data: {
                recipient: { id: senderId },
                message: { text: "Hello! The Hotoopia bot is alive!" }
              },
              headers: { 'Content-Type': 'application/json' }
            });
            console.log("Test reply sent successfully!");
          }
        }
      }
    }
  } catch (error) {
    // If the reply fails, print exactly why
    console.error("Meta API Error:", error.response ? error.response.data : error.message);
  }
});

module.exports.handler = serverless(app);
