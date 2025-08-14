const apiKey = "7940963701b55548c2c0cb807550fffc";
const voiceBtn = document.getElementById("voiceBtn");
const cityInput = document.getElementById("cityInput");

const weatherIcons = {
  clear: "fas fa-sun",
  clouds: "fas fa-cloud",
  rain: "fas fa-cloud-rain",
  thunderstorm: "fas fa-bolt",
  snow: "fas fa-snowflake",
  mist: "fas fa-smog",
  haze: "fas fa-smog",
  fog: "fas fa-smog",
  drizzle: "fas fa-cloud-rain",
};

const weatherColors = {
  clear: "#FFD700",
  clouds: "#A9A9A9",
  rain: "#4682B4",
  thunderstorm: "#9932CC",
  snow: "#E0FFFF",
  mist: "#D3D3D3",
  haze: "#D3D3D3",
  fog: "#D3D3D3",
  drizzle: "#87CEEB",
};

window.onload = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log(`📍 Location detected: ${latitude}, ${longitude}`);
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.warn(`⚠️ Location error: ${error.message}`);
        console.log("📍 Using default location: Udupi");
        fetchWeatherByCity("Udupi");
      },
      {
        enableHighAccuracy: true, // Try GPS/Wi-Fi first
        timeout: 10000, // Wait up to 10 seconds
        maximumAge: 0, // No cached position
      }
    );
  } else {
    console.log("⚠️ Geolocation not supported. Using default location: Udupi");
    fetchWeatherByCity("Udupi");
  }
};

function getWeatherByCity() {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
  }
}

function fetchWeatherByCity(city) {
  // Current weather by city name
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.cod === 200) {
        updateCurrentWeather(data);
        const { lat, lon } = data.coord;

        // Forecast data by coordinates
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        )
          .then((res) => res.json())
          .then((forecast) => {
            updateForecasts(forecast.list);
          });
      } else {
        alert("City not found! Showing default weather instead.");
        fetchWeatherByCity("Udupi");
      }
    })
    .catch(() => {
      alert("Error fetching weather data. Showing default weather instead.");
      fetchWeatherByCity("Udupi");
    });
}

function fetchWeatherByCoords(lat, lon) {
  // Current weather by coordinates
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      updateCurrentWeather(data);
    });

  // Forecast by coordinates
  fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      updateForecasts(data.list);
    });
}

function updateCurrentWeather(data) {
  if (!data || data.cod !== 200) return;

  const { name, main, wind, weather } = data;
  document.getElementById("city").innerText = name;
  document.getElementById("temp").innerText = Math.round(main.temp);
  document.getElementById("description").innerText = weather[0].description;
  document.getElementById("wind").innerText = `${wind.speed} km/h`;
  document.getElementById("humidity").innerText = `${main.humidity}%`;
  document.getElementById("feelsLike").innerText = `${Math.round(
    main.feels_like
  )}°C`;
  document.getElementById("pressure").innerText = `${main.pressure} hPa`;

  const weatherCondition = weather[0].main.toLowerCase();
  const mainIcon = document.getElementById("mainIcon");
  mainIcon.className = weatherIcons[weatherCondition] || "fas fa-question";
  mainIcon.style.color = weatherColors[weatherCondition] || "#FFFFFF";
}

function updateForecasts(forecastList) {
  updateHourlyForecast(forecastList.slice(0, 8));
  updateDailyForecast(forecastList);
}

function updateHourlyForecast(hourlyData) {
  const hourlyContainer = document.getElementById("todayForecast");
  hourlyContainer.innerHTML = "";

  hourlyData.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const time = formatAMPM(date);
    const weatherCondition = item.weather[0].main.toLowerCase();
    const iconClass = weatherIcons[weatherCondition] || "fas fa-question";
    const color = weatherColors[weatherCondition] || "#FFFFFF";
    const temp = Math.round(item.main.temp);

    const hourItem = document.createElement("div");
    hourItem.className = "hour-item";
    hourItem.innerHTML = `
            <div style="font-size:14px; margin-bottom:8px;">${time}</div>
            <i class="${iconClass}" style="color: ${color}; font-size: 24px;"></i>
            <div style="font-weight:600; margin-top:8px;">${temp}°</div>
        `;

    hourItem.addEventListener("click", () => {
      document.getElementById("temp").innerText = temp;
      document.getElementById("description").innerText =
        item.weather[0].description;
      const mainIcon = document.getElementById("mainIcon");
      mainIcon.className = iconClass;
      mainIcon.style.color = color;
      document.querySelector(".central-display").style.animation =
        "pulse 0.5s ease";
      setTimeout(() => {
        document.querySelector(".central-display").style.animation = "";
      }, 500);
    });

    hourlyContainer.appendChild(hourItem);
  });
}

function updateDailyForecast(forecastList) {
  const dailyContainer = document.getElementById("weeklyForecast");
  dailyContainer.innerHTML = "";

  const dailyData = {};
  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!dailyData[date]) {
      dailyData[date] = { temps: [], conditions: [], items: [] };
    }
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].conditions.push(item.weather[0].main);
    dailyData[date].items.push(item);
  });

  const days = Object.keys(dailyData).slice(0, 5);
  days.forEach((date, index) => {
    const dayData = dailyData[date];
    const high = Math.max(...dayData.temps);
    const low = Math.min(...dayData.temps);
    const mostCommonCondition = mode(dayData.conditions);
    const weatherCondition = mostCommonCondition.toLowerCase();
    const iconClass = weatherIcons[weatherCondition] || "fas fa-question";
    const color = weatherColors[weatherCondition] || "#FFFFFF";
    const dayName = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    const isToday = index === 0;

    const dayItem = document.createElement("div");
    dayItem.className = "day-item" + (isToday ? " active" : "");
    dayItem.innerHTML = `
            <div style="font-weight:600;">${dayName}</div>
            <i class="${iconClass}" style="color: ${color};"></i>
            <div>${Math.round(high)}° / ${Math.round(low)}°</div>
        `;

    dayItem.addEventListener("click", () => {
      document
        .querySelectorAll(".day-item")
        .forEach((item) => item.classList.remove("active"));
      dayItem.classList.add("active");
      updateHourlyForecast(dayData.items.slice(0, 8));

      const firstItem = dayData.items[0];
      if (firstItem) {
        document.getElementById("temp").innerText = Math.round(
          firstItem.main.temp
        );
        document.getElementById("description").innerText =
          firstItem.weather[0].description;
        const mainIcon = document.getElementById("mainIcon");
        mainIcon.className =
          weatherIcons[weatherCondition] || "fas fa-question";
        mainIcon.style.color = weatherColors[weatherCondition] || "f72585";
      }
      document.querySelector(".central-display").style.animation =
        "pulse 0.5s ease";
      setTimeout(() => {
        document.querySelector(".central-display").style.animation = "";
      }, 500);
    });

    dailyContainer.appendChild(dayItem);
  });
}

function mode(arr) {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
}

function formatAMPM(date) {
  let hours = date.getHours();
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}${ampm}`;
}

// Speech Recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener("click", () => {
    recognition.start();
    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript.trim();
    cityInput.value = transcript;
    recognition.stop();
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    getWeatherByCity();
  });

  recognition.addEventListener("speechend", () => {
    recognition.stop();
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  });

  recognition.addEventListener("error", (event) => {
    console.error("Speech recognition error: " + event.error);
    recognition.stop();
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
  });
} else {
  voiceBtn.style.display = "none";
}
