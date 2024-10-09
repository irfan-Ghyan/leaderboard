export default function handler(req, res) {
    // Set the CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allowed methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allowed headers

    if (req.method === 'OPTIONS') {
        res.status(200).end(); // Handle the preflight OPTIONS request
        return;
    }

    // Your logic for fetching settings data
    const settingsData = {
        trackTitle: 'Monza',
        carTitle: 'Ferrari SF90',
    };

    res.status(200).json(settingsData); // Send JSON response
}
