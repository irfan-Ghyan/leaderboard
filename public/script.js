let results = []; // Array to hold the results
let scrollInterval; // Variable to hold the scroll interval
let isScrolling = false; // Flag to track if scrolling is active
const scrollDelay = 5000; // Delay for scrolling

async function fetchResults() {
    const response = await fetch('/api/leaderboard');
    results = await response.json();
    displayResults(results);
    console.log(results);
}

// Function to fetch data from the API
async function fetchCarAndTrack() {
    try {
        const response = await fetch('/api/settings');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        // Update the track name and car name in the HTML
        document.getElementById('trackName').textContent = data.trackTitle || 'Track not available';
        document.getElementById('carName').textContent = data.carTitle || 'Car not available';

    } catch (error) {
        console.error('Error fetching car and track data:', error);

        // Show error messages in the HTML
        document.getElementById('trackName').textContent = 'Error loading track';
        document.getElementById('carName').textContent = 'Error loading car';
    }
}

// Function to format lap time for display
function formatLapTime(lapTime) {
    if (lapTime === '-' || lapTime === 999999999) {
        return '-';
    }

    const totalSeconds = Math.floor(lapTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(lapTime % 1000); // Use floor to get the whole milliseconds
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, 3)}`; // Display milliseconds
}

// Function to display the results in the DOM
function displayResults(results) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Clear existing results

    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.className = 'result-row'; // Add a class for styling
        const lapTime = formatLapTime(result.bestLap); // Format lap time

        // Define background colors for specific positions
        let nameBackgroundColor = '';
        if (index === 0) {
            nameBackgroundColor = 'gold';
        } else if (index === 1) {
            nameBackgroundColor = 'silver';
        } else if (index === 2) {
            nameBackgroundColor = '#cd7f32'; // Bronze
        } else {
            // For other rows, alternate between two colors
            nameBackgroundColor = index % 2 === 0 ? '#303030' : '#0f0f0f'; // Alternate colors
        }
        let textColor = index < 3 ? "black" : "white"; // Adjust text color

        // Insert the row with dynamic background color
        row.innerHTML = `
            <td class="position" style="background-color: ${nameBackgroundColor}; color : ${textColor}">${index + 1}</td>
            <td class="name" style="background-color: ${nameBackgroundColor}; color : ${textColor}">${result.driverName}</td>
            <td class="time" style="background-color: ${nameBackgroundColor}; color : ${textColor}">${lapTime}</td>
        `;
        resultsBody.appendChild(row);
    });

    setTimeout(startAutoScroll, 5000); // Delay scroll start by 5 seconds
}

// Function to start auto-scrolling
function startAutoScroll() {
    if (isScrolling) return; // Prevent multiple intervals from starting
    isScrolling = true; // Set the scrolling flag
    const resultsBody = document.getElementById('resultsBody');
    const resultsContainer = document.querySelector('.results-container');
    let scrollPosition = 0;
    const maxScroll = resultsBody.scrollHeight - resultsContainer.clientHeight;

    scrollInterval = setInterval(() => {
        scrollPosition += 1; // Scroll down by one row
        resultsContainer.scrollTop = scrollPosition;

        // Check if reached the end of the scroll
        if (scrollPosition >= maxScroll) {
            clearInterval(scrollInterval); // Stop scrolling
            isScrolling = false; // Reset the scrolling flag

            // Wait for 5 seconds before restarting
            setTimeout(() => {
                restartScroll(); // Call restart function
            }, scrollDelay); // 5 seconds delay before restarting
        }
    }, 50); // Adjust the speed of the scroll here
}

// Function to restart the scroll
function restartScroll() {
    const resultsContainer = document.querySelector('.results-container');
    resultsContainer.scrollTop = 0; // Reset scroll position to top
    startAutoScroll(); // Start scrolling again
}

// When the page loads, fetch the data and start scrolling
window.onload = async function() {
    await fetchCarAndTrack(); // Fetch data before scrolling
    fetchResults(); // Fetch results after fetching settings
};
