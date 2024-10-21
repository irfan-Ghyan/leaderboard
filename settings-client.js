async function fetchSettings() {
    try {
        // Fetch the settings from the server
        const response = await fetch('/settings'); // Updated to match your server endpoint
        if (!response.ok) throw new Error('Network response was not ok');
        const settings = await response.json();

        // Populate the form fields with the fetched data
        document.getElementById('carTitle').value = settings.carTitle || '';
        document.getElementById('trackTitle').value = settings.trackTitle || '';
        document.getElementById('startDateFilter').value = settings.startDateFilter || '';
        document.getElementById('endDateFilter').value = settings.endDateFilter || '';
        document.getElementById('trackFilters').value = settings.trackFilters ? settings.trackFilters.join(', ') : '';
        document.getElementById('carFilters').value = settings.carFilters ? settings.carFilters.join(', ') : '';
        document.getElementById('maxResults').value = settings.maxResults || 99;
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

// Call fetchSettings when the page loads
window.onload = fetchSettings;

// Handle form submission
document.getElementById('settingsForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const settings = {
        carTitle: document.getElementById('carTitle').value,
        trackTitle: document.getElementById('trackTitle').value,
        startDateFilter: document.getElementById('startDateFilter').value,
        endDateFilter: document.getElementById('endDateFilter').value,
        trackFilters: document.getElementById('trackFilters').value.split(',').map(item => item.trim()),
        carFilters: document.getElementById('carFilters').value.split(',').map(item => item.trim()),
        maxResults: parseInt(document.getElementById('maxResults').value, 10), // Parse to integer
    };

    try {
        const response = await fetch('/save-settings', { // Match the endpoint to your server
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (response.ok) {
            alert('Settings saved successfully!');
        } else {
            const errorMessage = await response.text(); // Get the error message from the server
            alert(`Failed to save settings: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
});
