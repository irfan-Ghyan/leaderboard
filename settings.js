const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve the settings.html file at the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html')); // Serve your HTML file
});

// Endpoint to get existing settings
app.get('/settings', (req, res) => {
    fs.readFile('settings.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading settings');
        }
        res.json(JSON.parse(data)); // Send the settings as JSON
    });
});

// Endpoint to save settings
app.post('/save-settings', (req, res) => {
    console.log('Received settings:', req.body); // Debugging line

    const formattedSettings = {
        carTitle: req.body.carTitle,  // Save car title
        trackTitle: req.body.trackTitle,  // Save track title
        startDateFilter: req.body.startDateFilter,
        endDateFilter: req.body.endDateFilter,
        trackFilters: req.body.trackFilters.length ? req.body.trackFilters : ['ALL'],
        carFilters: req.body.carFilters.length ? req.body.carFilters : ['ALL'],
        maxResults: req.body.maxResults
    };

    fs.writeFile('settings.json', JSON.stringify(formattedSettings, null, 2), (err) => {
        if (err) {
            return res.status(500).send('Error saving settings');
        }
        res.send('Settings saved');
    });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
