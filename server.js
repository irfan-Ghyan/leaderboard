// server.js
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors'); 

const app = express();
const PORT = 3333;
const DATA_DIR = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\assettocorsa\\server\\results";
const refreshSettingsMS = 10000;
const refreshResultsMs = 5000; 

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
  const requestedMaxResults = parseInt(req.query.maxResults, 10);
  if (!isNaN(requestedMaxResults) && requestedMaxResults > 0) {
    settings.maxResults = requestedMaxResults; // Update maxResults if valid
  }

  // Convert date and time to filter leaderboard data
  const filteredData = leaderboardData.filter(entry => {
    const entryDate = entry.date.replace(/_/g, '').slice(0, 8) + entry.date.split('_')[3] + entry.date.split('_')[4];
    const startDateFilter = settings.startDateFilter.replace(/[-T:]/g, '').slice(0, 12);
    const endDateFilter = settings.endDateFilter.replace(/[-T:]/g, '').slice(0, 12);
    
    const dateCondition = entryDate >= startDateFilter && entryDate <= endDateFilter;
    const trackCondition = settings.trackFilters.includes('ALL') || settings.trackFilters.includes(entry.trackName);
    const carCondition = settings.carFilters.includes('ALL') || settings.carFilters.includes(entry.carModel);

    return dateCondition && trackCondition && carCondition;
  });

  const limitedResults = filteredData.slice(0, settings.maxResults);

  res.json(limitedResults);
});

// Endpoint to get current settings
app.get('/api/settings', (req, res) => {
  res.json(settings); // Send the settings as JSON
});

// Endpoint to save settings
app.post('/api/save-settings', (req, res) => {
  const { startDateFilter, endDateFilter, trackFilters, carFilters, maxResults, carTitle, trackTitle } = req.body;

  try {
    // Update settings with new values
    settings.startDateFilter = startDateFilter || settings.startDateFilter;
    settings.endDateFilter = endDateFilter || settings.endDateFilter;
    settings.trackFilters = trackFilters || settings.trackFilters;
    settings.carFilters = carFilters || settings.carFilters;
    settings.maxResults = maxResults || settings.maxResults;
    settings.carTitle = carTitle || settings.carTitle;
    settings.trackTitle = trackTitle || settings.trackTitle;

    // Save updated settings to file
    saveSettings();
    res.send('Settings saved');
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).send('Error saving settings');
  }
});

// Function to read JSON files and populate leaderboardData
async function readJSONFiles() {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const driverMap = {}; // To track the best lap time per driver
    const completedDrivers = new Set(); // To track drivers who completed laps

    for (const file of jsonFiles) {
      const filePath = path.join(DATA_DIR, file);
      let content;

      try {
        content = await fs.readJson(filePath);
        if (!content || !content.Laps || !content.TrackName || !content.Type) {
          //console.warn(`Skipping file due to missing required fields: ${file}`);
          continue;
        }
      } catch (error) {
        console.error(`Error reading or parsing JSON file: ${file}`, error);
        continue;
      }

      // Filter by session type (practice, qualify, race)
      const sessionType = content.Type.toUpperCase();
      const allowPractice = settings.practice === 1;
      const allowQualify = settings.qualify === 1;
      const allowRace = settings.race === 1;

      if (
        (sessionType === 'PRACTICE' && !allowPractice) ||
        (sessionType === 'QUALIFY' && !allowQualify) ||
        (sessionType === 'RACE' && !allowRace)
      ) {
        //console.log(`Skipping file due to session type filter: ${file}`);
        continue;
      }

      // Extract session date from file name
      const dateMatch = file.match(/^(\d{4})_(\d{1,2})_(\d{1,2})_(\d{1,2})_(\d{1,2})/);
      if (!dateMatch) {
        continue;
      }

      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      const hour = dateMatch[4].padStart(2, '0');
      const minute = dateMatch[5].padStart(2, '0');
      const sessionDate = `${year}_${month}_${day}_${hour}_${minute}`;

      // Check if the session date falls within the filter range
      const sessionDateNumeric = `${year}${month}${day}${hour}${minute}`;
      const startDateFilterNumeric = settings.startDateFilter.replace(/[-T:]/g, '').slice(0, 12);
      const endDateFilterNumeric = settings.endDateFilter.replace(/[-T:]/g, '').slice(0, 12);
      if (sessionDateNumeric < startDateFilterNumeric || sessionDateNumeric > endDateFilterNumeric) {
        continue; // Skip files outside the date range
      }
      console.log(`Reading file: ${file}`);
      const trackName = content.TrackName;
      const results = content.Result || []; // Focus on the Results section

      // Process the Results section
      results.forEach((entry) => {
        const driverName = entry.DriverName.trim().toLowerCase();  // Convert to lowercase for consistency
        const bestLapTime = entry.BestLap === 999999999 ? '-' : Number(entry.BestLap);
        const totalTime = Number(entry.TotalTime);

        // Store driver details
        if (!driverMap[driverName]) {
          driverMap[driverName] = {
            driverName: entry.DriverName.trim(), // Store original name for display
            carModel: entry.CarModel,
            bestLap: bestLapTime,
            totalTime: totalTime,
            trackName: trackName,
            date: sessionDate,
            completedLaps: 0 // Keep track of completed laps
          };
        } else {
          // Update the best lap time if a better one is found
          if (bestLapTime !== '-' && (driverMap[driverName].bestLap === '-' || bestLapTime < driverMap[driverName].bestLap)) {
            driverMap[driverName].bestLap = bestLapTime;
          }
        }
      });

      // Process the Laps section
      const laps = content.Laps || []; // Focus on the Laps section
      laps.forEach((lap) => {
        const driverName = lap.DriverName.trim().toLowerCase(); // Ensure we get the driver name from laps
        if (driverMap[driverName]) {
          completedDrivers.add(driverName); // Add driver to the set of completed drivers
          driverMap[driverName].completedLaps += 1; // Update the driver's completed laps count
        }
      });
    }

    // Filter to only include drivers who completed at least one lap or appeared in the Results
    leaderboardData = Object.values(driverMap).filter(driver => completedDrivers.has(driver.driverName.toLowerCase()));

    // Sort the leaderboard with valid lap times first, then entries with a '-' lap time
    leaderboardData.sort((a, b) => {
      if (a.bestLap === '-' && b.bestLap === '-') return 0;
      if (a.bestLap === '-') return 1;
      if (b.bestLap === '-') return -1;
      return a.bestLap - b.bestLap;
    });

    console.log(`Total unique drivers loaded: ${leaderboardData.length}`);
    //console.log(driverMap);
  } catch (error) {
    console.error('Error reading JSON files:', error);
  }
}

// Check for new JSON files every 10 seconds
setInterval(readJSONFiles, refreshResultsMs);

setInterval(loadSettings, refreshSettingsMS);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  readJSONFiles(); // Initial read
});
