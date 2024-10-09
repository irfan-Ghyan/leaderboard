let results = []; // Array to hold the results
let scrollInterval; // Variable to hold the scroll interval
let isScrolling = false; // Flag to track if scrolling is active
const scrollDelay = 5000; // Delay for scrolling

async function fetchResults() {
    const response = await fetch('/api/leaderboard');
    results = await response.json();
    displayResults(results);
}

// async function fetchCarAndTrack() {
//     try {
//         const response = await fetch('/api/settings'); // Adjust this endpoint as needed
//         console.log(response);
//         const data = await response.json();
        
//         console.log("Fetched settings:", data); // Log the response data

//         // Update the track and car information
//         document.getElementById('trackName').textContent = data.trackTitle || 'Track not available';
//         document.getElementById('carName').textContent = data.carTitle || 'Car not available';
//     } catch (error) {
//         console.error("Error fetching car and track data:", error);
//         document.getElementById('trackName').textContent = 'Error loading track';
//         document.getElementById('carName').textContent = 'Error loading car';
//     }
// }


// Function to fetch data from the API
async function fetchCarAndTrack() {
    try {
        const response = await fetch('/api/settings');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        populateResults(data); // Call function to populate results
        return data;
    } catch (error) {
        console.error('Error fetching car and track data:', error);
    }
}


// function displayResults(results) {
//     const resultsBody = document.getElementById('resultsBody');
//     resultsBody.innerHTML = ''; // Clear existing results

//     results.forEach((result, index) => {
//         const row = document.createElement('tr');
//         row.className = 'result-row'; // Add a class for styling
//         const lapTime = formatLapTime(result.bestLap);

//         // Define background colors for specific positions
//         let nameBackgroundColor = '';
//         if (index === 0) {
//             nameBackgroundColor = 'gold';
//         } else if (index === 1) {
//             nameBackgroundColor = 'silver';
//         } else if (index === 2) {
//             nameBackgroundColor = '#cd7f32';
//         } else {
//             // For other rows, alternate between two colors or generate a dynamic color
//             nameBackgroundColor = index % 2 === 0 ? '#f2f2f2' : '#e6e6e6'; // Alternate colors
//         }

//         // Insert the row with dynamic background color
//         row.innerHTML = `
//             <td class="position" style="background-color: ${nameBackgroundColor};">${index + 1}</td>
//             <td class="name" style="background-color: ${nameBackgroundColor};">${result.driverName}</td>
//             <td class="time" style="background-color: ${nameBackgroundColor};">${lapTime}</td>
//         `;
//         resultsBody.appendChild(row);
//     });

//     setTimeout(startAutoScroll, 5000); // Delay scroll start by 5 seconds
// }



// Function to display the results in the DOM
function displayResults(results) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Clear existing results

    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.className = 'result-row'; // Add a class for styling
        const lapTime = formatLapTime(result.bestLap);

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
            nameBackgroundColor = index % 2 === 0 ? '#f2f2f2' : '#e6e6e6'; // Alternate colors
        }

        // Insert the row with dynamic background color
        row.innerHTML = `
            <td class="position" style="background-color: ${nameBackgroundColor};">${index + 1}</td>
            <td class="name" style="background-color: ${nameBackgroundColor};">${result.driverName}</td>
            <td class="time" style="background-color: ${nameBackgroundColor};">${lapTime}</td>
        `;
        resultsBody.appendChild(row);
    });

    setTimeout(startAutoScroll, 5000); // Delay scroll start by 5 seconds
}


// Function to populate results into the DOM
function populateResults(data) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = ''; // Clear any existing content

    // Loop through each item and create a new row
    data.forEach((item) => {
        const row = document.createElement('div');
        row.classList.add('result-row');
        row.innerHTML = `
            <div>${item.driverName}</div>
            <div>${item.carModel}</div>
            <div>${item.trackName}</div>
            <div>${item.bestLap}</div>
        `;
        resultsBody.appendChild(row);
    });
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
    startAutoScroll(); // Start the scroll after data is populated
};



function restartScroll() {
    const resultsContainer = document.querySelector('.results-container');
    resultsContainer.scrollTop = 0; // Reset scroll position

    // Wait for 5 seconds before starting to scroll again
    setTimeout(() => {
        startAutoScroll(); // Start scrolling again
    }, scrollDelay); // 5 seconds delay before starting to scroll
}

function formatLapTime(lapTimeMs) {
    const totalSeconds = Math.floor(lapTimeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(lapTimeMs % 1000); // Use floor to get the whole milliseconds
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, 3)}`; // Display milliseconds
}

// Fetch results and settings when the page loads
window.onload = async () => {
    await fetchCarAndTrack();
    fetchResults();
};
