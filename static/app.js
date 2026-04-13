const form = document.getElementById('weather-form');
const locationInput = document.getElementById('location-input');
const statusEl = document.getElementById('status');
const locationEl = document.getElementById('weather-location');
const summaryEl = document.getElementById('weather-summary');
const tempEl = document.getElementById('weather-temp');
const humidityEl = document.getElementById('weather-humidity');
const windEl = document.getElementById('weather-wind');
const updatedEl = document.getElementById('weather-updated');
const forecastGrid = document.getElementById('forecast-grid');

function formatForecastDay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function buildForecastCards(forecastDays) {
  if (!forecastDays || forecastDays.length === 0) {
    return `<div class="col-span-full rounded-[1.75rem] bg-white/90 p-6 text-center text-[#374955] shadow-sm">No forecast available.</div>`;
  }

  return forecastDays
    .slice(0, 3)
    .map((day) => {
      const dayName = formatForecastDay(day.date);
      const iconUrl = day.day.condition.icon.replace('http:', 'https:');
      return `
        <div class="rounded-[1.75rem] bg-white/90 p-5 text-center text-[#374955] shadow-sm ring-1 ring-[#A5896E]/30">
          <p class="text-sm uppercase tracking-[0.35em] text-[#15694C]">${dayName}</p>
          <img src="${iconUrl}" alt="${day.day.condition.text}" class="mx-auto my-4 h-16 w-16" />
          <p class="text-sm text-[#4a5b64]">${day.day.condition.text}</p>
          <div class="mt-4 flex items-center justify-center gap-3 text-sm text-[#70583E]">
            <span>${Math.round(day.day.maxtemp_c)}°</span>
            <span>•</span>
            <span>${Math.round(day.day.mintemp_c)}°</span>
          </div>
        </div>
      `;
    })
    .join('');
}

function displayWeather(payload) {
  const current = payload.current || {};
  const location = payload.location || {};
  const forecastDays = payload.forecast?.forecastday || [];

  const locationName = [location.name, location.region, location.country].filter(Boolean).join(', ');
  const condition = current.condition?.text || 'Clear skies';
  const temp = current.temp_c !== undefined ? `${Math.round(current.temp_c)}°C` : 'N/A';
  const humidity = current.humidity !== undefined ? `${current.humidity}%` : 'N/A';
  const wind = current.wind_kph !== undefined ? `${Math.round(current.wind_kph)} km/h` : 'N/A';
  const updated = location.localtime || '';

  locationEl.textContent = locationName || 'Unknown location';
  summaryEl.textContent = condition;
  tempEl.textContent = temp;
  humidityEl.textContent = humidity;
  windEl.textContent = wind;
  updatedEl.textContent = updated ? `Updated ${updated}` : '';
  forecastGrid.innerHTML = buildForecastCards(forecastDays);
}

async function fetchWeather(query) {
  statusEl.textContent = 'Loading weather…';
  forecastGrid.innerHTML = '';

  try {
    const response = await fetch(`/api/weather?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch weather');
    }

    const payload = await response.json();
    displayWeather(payload);
    statusEl.textContent = '';
  } catch (error) {
    statusEl.textContent = error.message;
    console.error(error);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = locationInput.value.trim();
  if (!query) {
    statusEl.textContent = 'Please enter a location first.';
    return;
  }
  fetchWeather(query);
});

fetchWeather(locationInput.value.trim());
