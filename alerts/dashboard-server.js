const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = 5000;

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/alerts', (req, res) => {
  fs.readFile(path.join(__dirname, 'log.txt'), 'utf8', (err, data) => {
    if (err) return res.status(500).send('Could not read log.');
    const lines = data.trim().split('\n').reverse();
    const entries = lines.map(line => {
      try {
        const parts = line.split(' - ');
        return {
          timestamp: parts[0],
          data: JSON.parse(parts[1])
        };
      } catch {
        return { raw: line };
      }
    });
    res.json(entries);
  });
});

app.post('/forward', (req, res) => {
  const alert = req.body;
  const message = {
    content: `⚠️ New Alert: ${alert.type || 'Unknown'}\nDetails: ${JSON.stringify(alert)}`
  };

  fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })
    .then(() => res.send('Forwarded to Discord.'))
    .catch(err => {
      console.error(err);
      res.status(500).send('Failed to forward.');
    });
});

app.listen(PORT, () => console.log(`Dashboard server running at http://localhost:${PORT}`));
