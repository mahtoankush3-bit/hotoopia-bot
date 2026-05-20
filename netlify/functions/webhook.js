const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());

// Handle Meta's Webhook Verification Knock
app.get('*', (req, res) => {
  const VERIFY_TOKEN = "hotoopia_secure_webhook_123";

  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // If Meta is knocking with the right password, let them in!
  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403); // Wrong password
    }
  }
  
  return res.status(200).send("Hotoopia Bot is awake!");
});

// Handle Incoming DMs (The logic will go here later!)
app.post('*', (req, res) => {
  console.log("Message Received!", req.body);
  return res.status(200).send("EVENT_RECEIVED");
});

// The magical exit door for Netlify!
module.exports.handler = serverless(app);
