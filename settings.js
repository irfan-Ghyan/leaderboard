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
            console.error('Error reading settings:', err);
            return res.status(500).send('Error reading settings');
        }
        try {
            const settings = JSON.parse(data);
            res.json(settings); // Send the settings as JSON
        } catch (parseError) {
            console.error('Error parsing settings:', parseError);
            return res.status(500).send('Error parsing settings');
        }
    });
});


// Endpoint to save settings
app.post('/save-settings', (req, res) => {
    console.log('Received settings:', req.body); // Debugging line

    const formattedSettings = {
        carTitle: req.body.carTitle || '',  // Default to empty string if undefined
        trackTitle: req.body.trackTitle || '',  // Default to empty string if undefined
        startDateFilter: req.body.startDateFilter || '', // Ensure it has a default
        endDateFilter: req.body.endDateFilter || '', // Ensure it has a default
        trackFilters: req.body.trackFilters && req.body.trackFilters.length ? req.body.trackFilters : ['ALL'],
        carFilters: req.body.carFilters && req.body.carFilters.length ? req.body.carFilters : ['ALL'],
        maxResults: req.body.maxResults || 20 // Set a default value if undefined
    };

    console.log('Formatted Settings to save:', formattedSettings); // Log the formatted settings

    fs.writeFile('settings.json', JSON.stringify(formattedSettings, null, 2), (err) => {
        if (err) {
            console.error('Error saving settings:', err); // Log the error for debugging
            return res.status(500).send(`Error saving settings: ${err.code} - ${err.message}`); // Send a more detailed error message
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
