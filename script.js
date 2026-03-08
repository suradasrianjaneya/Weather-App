const apiKey = '8a93bf1f2da53fcd45d048d337967c63';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const humidityElement = document.getElementById('humidity');

searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeather(location);
    }else{
        showPopup("Please enter a city");
    }
});

function showPopup(message){

    const popup = document.getElementById("popup");

    popup.textContent = message;

    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, 2000);

}

function fetchWeather(location) {
    const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            locationElement.textContent = data.name;
            temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
            descriptionElement.textContent = data.weather[0].description;
            humidityElement.textContent = `Humidity: ${data.main.humidity}%`;
        })
        .catch(error => {
            showPopup('Error fetching weather data. Couldn\'t find the city');
        });
}