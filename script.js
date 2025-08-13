
const apiKey = "7940963701b55548c2c0cb807550fffc";

const voiceBtn = document.getElementById('voiceBtn');
const cityInput = document.getElementById('cityInput');

window.onload = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        console.log("Location access denied. Please search for a city.");
      }
    );
  }
};

function getTodayDateStr() {
  const now = new Date();
  return now.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function fetchWeatherByCoords(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      updateCurrentWeather(data);
    });

  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      const todayStr = getTodayDateStr();
      const todayForecast = data.list.filter(item => item.dt_txt.startsWith(todayStr));

      updateWeeklyForecast(data.list);      // full 5-day data for weekly
      updateHourlyForecast(todayForecast);  // only today's data for hourly
    });

  fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      updateExtras(data);
    });
}

function getWeatherByCity() {
  const city = cityInput.value;
  fetchWeatherByCity(city);
}

function fetchWeatherByCity(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      updateCurrentWeather(data);
      const { lat, lon } = data.coord;
      fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`)
        .then((res) => res.json())
        .then((extraData) => {
          updateExtras(extraData);
        });
    });

  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      const todayStr = getTodayDateStr();
      const todayForecast = data.list.filter(item => item.dt_txt.startsWith(todayStr));

      updateWeeklyForecast(data.list);
      updateHourlyForecast(todayForecast);
    });
}

function updateCurrentWeather(data) {
  if (!data || data.cod !== 200) return alert("City not found!");

  const { name, main, wind, weather, sys } = data;
  document.getElementById("city").innerText = name;
  document.getElementById("temp").innerText = `${Math.round(main.temp)}°C`;

  document.getElementById("wind").innerText = `${wind.speed} km/h`;
  document.getElementById("humidity").innerText = `${main.humidity}%`;
  document.getElementById("sunrise").innerText = formatTime(sys.sunrise);
  document.getElementById("sunset").innerText = formatTime(sys.sunset);

  const iconMap = {
    clear: "☀️",
    clouds: "☁️",
    rain: "🌧️",
    thunderstorm: "⛈️",
    snow: "❄️",
    mist: "🌫️",
  };

  const mainIcon = iconMap[weather[0].main.toLowerCase()] || "❓";
  const iconEl = document.getElementById("mainIcon");
  iconEl.innerText = mainIcon;
  iconEl.classList.add("bounce");
  setTimeout(() => iconEl.classList.remove("bounce"), 1000);
}

function updateExtras(data) {
  if (!data || !data.current) return;

  const rain = data.current.rain ? data.current.rain["1h"] : 0;
  const rainChance = `${Math.round((rain / 1) * 100)}%`;
  const uvIndex = data.current.uvi;

  document.getElementById("rainChance").innerText = rainChance;
  document.getElementById("uv").innerText = uvIndex;
}

function updateHourlyForecast(forecastList) {
  const hourlyContainer = document.getElementById("todayForecast");
  hourlyContainer.innerHTML = "";

  forecastList.forEach(item => {
    const date = new Date(item.dt_txt);
    const time = formatAMPM(date);
    const icon = getWeatherIcon(item.weather[0].main.toLowerCase());
    const temp = Math.round(item.main.temp);

    const hourDiv = document.createElement("div");
    hourDiv.className = "hour fade-in shadow-glow";
    hourDiv.innerHTML = `
      <div>${time}</div>
      <div>${icon}</div>
      <div>${temp}°C</div>
    `;
    hourlyContainer.appendChild(hourDiv);
  });
}

function updateWeeklyForecast(forecastList) {
  const dailyData = {};

  forecastList.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        conditions: [],
        hourly: []
      };
    }

    dailyData[date].temps.push(item.main.temp);
    dailyData[date].conditions.push(item.weather[0].main);
    dailyData[date].hourly.push(item);
  });

  const weeklyEl = document.getElementById("weeklyForecast");
  weeklyEl.innerHTML = "";

  const dailyEntries = Object.entries(dailyData);
  if (dailyEntries.length === 0) return;

  // Show only next 5 days (including today)
  dailyEntries.slice(0, 5).forEach(([dateStr, data], i) => {
    const high = Math.max(...data.temps);
    const low = Math.min(...data.temps);
    const mostCommonCondition = mode(data.conditions);
    const icon = getWeatherIcon(mostCommonCondition.toLowerCase());
    const date = new Date(dateStr);
    const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });

    const forecastDiv = document.createElement("div");
    forecastDiv.className = "forecast-day slide-up neon-border";
    forecastDiv.innerHTML = `
      <div>${dayName}</div>
      <div>${icon} ${mostCommonCondition}</div>
      <div>${Math.round(high)}°C / ${Math.round(low)}°C</div>
    `;
  forecastDiv.addEventListener("click", () => {
  document.getElementById("hourlyTitle").innerText = `${dayName}'s Forecast`;
  updateHourlyForecast(data.hourly);

  // Update air conditions based on first data point of that day
  const firstItem = data.hourly[0];
  if (firstItem) {
    document.getElementById("wind").innerText = `${firstItem.wind.speed} km/h`;
    document.getElementById("humidity").innerText = `${firstItem.main.humidity}%`;

    document.getElementById("rainChance").innerText = (firstItem.pop ? Math.round(firstItem.pop * 100) : 0) + "%";
    document.getElementById("uv").innerText = "N/A"; // UV index not available from forecast
  }
});


    weeklyEl.appendChild(forecastDiv);
  });
}

// Helper: find mode of an array (most common value)
function mode(arr) {
  return arr.sort((a,b) =>
    arr.filter(v => v===a).length - arr.filter(v => v===b).length
  ).pop();
}

function getWeatherIcon(condition) {
  const icons = {
    clear: "☀️",
    clouds: "☁️",
    rain: "🌧️",
    thunderstorm: "⛈️",
    snow: "❄️",
    mist: "🌫️",
  };
  return icons[condition] || "❓";
}

function formatAMPM(date) {
  let hours = date.getHours();
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours} ${ampm}`;
}

function formatTime(unixTime) {
  const date = new Date(unixTime * 1000);
  return formatAMPM(date);
}

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener('click', () => {
    recognition.start();
    voiceBtn.style.backgroundColor = '#0ea5e9';  // optional visual feedback
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript.trim();
    cityInput.value = transcript;
    recognition.stop();
    voiceBtn.style.backgroundColor = ''; // reset color

    // Trigger your search function after voice input
    getWeatherByCity();
  });

  recognition.addEventListener('speechend', () => {
    recognition.stop();
    voiceBtn.style.backgroundColor = ''; // reset color
  });

  recognition.addEventListener('error', (event) => {
    console.error('Speech recognition error detected: ' + event.error);
    recognition.stop();
    voiceBtn.style.backgroundColor = ''; // reset color
  });
} else {
  voiceBtn.style.display = 'none'; // hide mic button if not supported
}

