async function fetchSettings() {
    try {
        const response = await fetch('/settings');
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
        // Set checkbox values (if 1, checked; if 0, unchecked)
        document.getElementById('practiceCheckbox').checked = settings.practice === 1;
        document.getElementById('qualifyCheckbox').checked = settings.qualify === 1;
        document.getElementById('raceCheckbox').checked = settings.race === 1;
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

window.onload = fetchSettings;

document.getElementById('settingsForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const settings = {
        carTitle: document.getElementById('carTitle').value,
        trackTitle: document.getElementById('trackTitle').value,
        startDateFilter: document.getElementById('startDateFilter').value,
        endDateFilter: document.getElementById('endDateFilter').value,
        trackFilters: document.getElementById('trackFilters').value.split(',').map(item => item.trim()),
        carFilters: document.getElementById('carFilters').value.split(',').map(item => item.trim()),
        maxResults: parseInt(document.getElementById('maxResults').value, 10), // Parse to integer
        practice: document.getElementById('practiceCheckbox').checked ? 1 : 0,
        qualify: document.getElementById('qualifyCheckbox').checked ? 1 : 0,
        race: document.getElementById('raceCheckbox').checked ? 1 : 0,
    };

    try {
        const response = await fetch('/save-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (response.ok) {
            alert('Settings saved successfully!');
        } else {
            const errorMessage = await response.text();
            alert(`Failed to save settings: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
});
