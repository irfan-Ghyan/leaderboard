// server.js
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors'); 

const app = express();
const PORT = 3000;
const DATA_DIR = "D:\\Leaderboard\\results"; 

let leaderboardData = [];

// CORS middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
}));


// Settings loaded from settings.json
let settings = {
  startDateFilter: '2023-09-09T12:39',
  endDateFilter: '2024-09-09T13:51',
  trackFilters: ['ALL'], // Track filters, can include multiple track names
  carFilters: ['ALL'],   // Car filters, can include multiple car models
  maxResults: 20,        // Maximum number of results to show (default value)
  carTitle: '',          // New field for car title
  trackTitle: ''         // New field for track title
};

// Middleware to serve the static frontend files
app.use(express.static('public'));
app.use(express.json()); // Middleware to parse JSON request bodies

// Function to load settings from settings.json
const loadSettings = () => {
  try {
    const data = fs.readFileSync('settings.json', 'utf8');
    settings = JSON.parse(data);
  } catch (err) {
    console.error('Error reading settings file:', err);
    // If the settings file doesn't exist, the default settings will be used.
  }
};

// Function to save settings to settings.json
const saveSettings = () => {
  fs.writeFileSync('settings.json', JSON.stringify(settings, null, 2));
};

// Load settings on server startup
loadSettings();

// Endpoint to get leaderboard data
app.get('/api/leaderboard', (req, res) => {
  // Check if a maxResults query parameter is provided
  const requestedMaxResults = parseInt(req.query.maxResults, 10);
  if (!isNaN(requestedMaxResults) && requestedMaxResults > 0) {
    settings.maxResults = requestedMaxResults; // Update maxResults if valid
  }

  console.log(`Filter range: ${settings.startDateFilter} to ${settings.endDateFilter}`);
  
  const filteredData = leaderboardData.filter(entry => {
    // Convert the session date from 'YYYY_M_D_HH_MM' to 'YYYYMMDDHHMM' for comparison
    const entryDate = entry.date.replace(/_/g, '').slice(0, 10) + entry.date.split('_')[3] + '00'; 
    
    // Filter conditions
    const dateCondition = entryDate >= settings.startDateFilter && entryDate <= settings.endDateFilter;
    const trackCondition = settings.trackFilters.includes('ALL') || settings.trackFilters.includes(entry.trackName);
    const carCondition = settings.carFilters.includes('ALL') || settings.carFilters.includes(entry.carModel);

    return dateCondition && trackCondition && carCondition;
  });

  // Limit results based on maxResults
  const limitedResults = filteredData.slice(0, settings.maxResults);

  console.log(`Filtered data count: ${filteredData.length}, Returning: ${limitedResults.length}`); // Debugging line
  res.json(limitedResults);
});

// Endpoint to get current settings
app.get('/api/settings', (req, res) => {
  res.json(settings); // Send the settings as JSON
});

// Endpoint to save settings
app.post('/api/save-settings', (req, res) => {
  const { startDateFilter, endDateFilter, trackFilters, carFilters, maxResults, carTitle, trackTitle } = req.body;

  // Update settings with new values
  settings.startDateFilter = startDateFilter;
  settings.endDateFilter = endDateFilter;
  settings.trackFilters = trackFilters;
  settings.carFilters = carFilters;
  settings.maxResults = maxResults;
  settings.carTitle = carTitle; // Save car title
  settings.trackTitle = trackTitle; // Save track title

  // Save updated settings to file
  saveSettings();
  res.send('Settings saved');
});

async function readJSONFiles() {
  try {
      const files = await fs.readdir(DATA_DIR);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const driverMap = {}; // To track the best lap time per driver

      for (const file of jsonFiles) {
          const filePath = path.join(DATA_DIR, file);
          const content = await fs.readJson(filePath);

          // Extract the date and hour from the file name
          const dateMatch = file.match(/^(\d{4})_(\d{1,2})_(\d{1,2})_(\d{1,2})_(\d{1,2})/);
          if (dateMatch) {
              const year = dateMatch[1];
              const month = dateMatch[2].padStart(2, '0');
              const day = dateMatch[3].padStart(2, '0');
              const hour = dateMatch[4].padStart(2, '0');
              const minute = dateMatch[5].padStart(2, '0');
              const sessionDate = `${year}_${month}_${day}_${hour}_${minute}`;

              const trackName = content.TrackName;
              const results = content.Result || [];

              results.forEach((entry) => {
                  if (entry.BestLap !== 999999999) {
                      const driverName = entry.DriverName.trim(); // Ensure trimmed name
                      
                      // Check if the driver is already in the map or has a better lap
                      if (!driverMap[driverName] || entry.BestLap < driverMap[driverName].bestLap) {
                          driverMap[driverName] = {
                              driverName,
                              carModel: entry.CarModel,
                              bestLap: entry.BestLap,
                              totalTime: entry.TotalTime,
                              trackName: trackName,
                              date: sessionDate,
                          };
                      }
                  }
              });
          }
      }

      // Convert the map back to an array
      leaderboardData = Object.values(driverMap);

      // Sort the leaderboard by best lap time (ascending)
      leaderboardData.sort((a, b) => a.bestLap - b.bestLap);

      console.log(`Total unique drivers loaded: ${leaderboardData.length}`);
  } catch (error) {
      console.error('Error reading JSON files:', error);
  }
}

// Check for new JSON files every 10 seconds
setInterval(readJSONFiles, 10000);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  readJSONFiles(); // Initial read
});

