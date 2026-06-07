/* ==========================================================================
   AERO WEATHER DASHBOARD - APPLICATION CONTROLLER & CANVAS SIMULATOR
   ========================================================================== */

// --- Global Config & Constants ---
const apiKey = '8a93bf1f2da53fcd45d048d337967c63';
const apiBase = 'https://api.openweathermap.org/data/2.5/';

// Curated list of cities for search autocomplete
const autocompleteCities = [
    { name: "London", country: "United Kingdom", searchStr: "London,GB" },
    { name: "New York", country: "United States", searchStr: "New York,US" },
    { name: "Tokyo", country: "Japan", searchStr: "Tokyo,JP" },
    { name: "Paris", country: "France", searchStr: "Paris,FR" },
    { name: "Berlin", country: "Germany", searchStr: "Berlin,DE" },
    { name: "Rome", country: "Italy", searchStr: "Rome,IT" },
    { name: "Sydney", country: "Australia", searchStr: "Sydney,AU" },
    { name: "Singapore", country: "Singapore", searchStr: "Singapore,SG" },
    { name: "Dubai", country: "United Arab Emirates", searchStr: "Dubai,AE" },
    { name: "Mumbai", country: "India", searchStr: "Mumbai,IN" },
    { name: "Delhi", country: "India", searchStr: "Delhi,IN" },
    { name: "Cairo", country: "Egypt", searchStr: "Cairo,EG" },
    { name: "Moscow", country: "Russia", searchStr: "Moscow,RU" },
    { name: "Toronto", country: "Canada", searchStr: "Toronto,CA" },
    { name: "Vancouver", country: "Canada", searchStr: "Vancouver,CA" },
    { name: "Los Angeles", country: "United States", searchStr: "Los Angeles,US" },
    { name: "San Francisco", country: "United States", searchStr: "San Francisco,US" },
    { name: "Chicago", country: "United States", searchStr: "Chicago,US" },
    { name: "Miami", country: "United States", searchStr: "Miami,US" },
    { name: "Seoul", country: "South Korea", searchStr: "Seoul,KR" },
    { name: "Bangkok", country: "Thailand", searchStr: "Bangkok,TH" },
    { name: "Hong Kong", country: "Hong Kong", searchStr: "Hong Kong,HK" },
    { name: "Cape Town", country: "South Africa", searchStr: "Cape Town,ZA" },
    { name: "Rio de Janeiro", country: "Brazil", searchStr: "Rio de Janeiro,BR" },
    { name: "Buenos Aires", country: "Argentina", searchStr: "Buenos Aires,AR" },
    { name: "Istanbul", country: "Turkey", searchStr: "Istanbul,TR" },
    { name: "Shanghai", country: "China", searchStr: "Shanghai,CN" },
    { name: "Barcelona", country: "Spain", searchStr: "Barcelona,ES" },
    { name: "Amsterdam", country: "Netherlands", searchStr: "Amsterdam,NL" }
];

// Curated weather facts
const weatherFacts = [
    "A single lightning bolt can heat the air to 30,000°C—5 times hotter than the sun's surface.",
    "A moderate thunderstorm releases energy equivalent to a 10-megaton nuclear bomb.",
    "Snowflakes are not actually white; they are translucent and reflect light off their facets.",
    "A cloud can weigh more than 1 million pounds (500 tons)—about the weight of a loaded Boeing 747.",
    "Raindrops are not tear-shaped; they resemble hamburger buns due to air resistance.",
    "Yuma, Arizona is the sunniest place on Earth, averaging over 4,000 hours of sunlight yearly.",
    "The coldest temp recorded on Earth was -89.2°C at Vostok Station, Antarctica in 1983.",
    "The highest temp recorded was 56.7°C in Death Valley, California in 1913.",
    "Cherrapunji, India is one of the wettest places, once receiving 26,470 mm of rain in one year.",
    " Twinkling stars are caused by light passing through layers of turbulent air in Earth's atmosphere."
];


// ==========================================================================
// BACKGROUND CANVAS SIMULATOR (WeatherCanvas Engine)
// ==========================================================================
class WeatherCanvas {
    constructor() {
        this.canvas = document.getElementById('weather-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.clouds = [];
        this.splashes = [];
        this.type = 'clear'; // clear, clouds, rain, thunderstorm, snow
        this.isNight = false;
        this.time = 0;
        this.flashOpacity = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
        this.initParticles();
    }

    setWeather(type, isNight) {
        if (this.type === type && this.isNight === isNight) return;
        this.type = type;
        this.isNight = isNight;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        this.clouds = [];
        this.splashes = [];

        // Spawn clouds for cloudy/rainy/thunderstorm states
        if (this.type === 'clouds' || this.type === 'rain' || this.type === 'thunderstorm') {
            const numClouds = this.type === 'clouds' ? 4 : 2;
            for (let i = 0; i < numClouds; i++) {
                this.clouds.push(new DriftCloud(this.w, this.h));
            }
        }

        // Night state star spawn
        if (this.isNight) {
            const numStars = Math.floor((this.w * this.h) / 8000);
            for (let i = 0; i < Math.min(numStars, 120); i++) {
                this.particles.push(new TwinkleStar(this.w, this.h));
            }
        }

        // Particle conditions
        if (this.type === 'rain' || this.type === 'thunderstorm') {
            const numDrops = Math.floor(this.w / 15);
            for (let i = 0; i < Math.min(numDrops, 120); i++) {
                this.particles.push(new RainDrop(this.w, this.h));
            }
        } else if (this.type === 'snow') {
            const numFlakes = Math.floor(this.w / 20);
            for (let i = 0; i < Math.min(numFlakes, 100); i++) {
                this.particles.push(new Snowflake(this.w, this.h));
            }
        } else if (this.type === 'clear' && !this.isNight) {
            // Sunny sparkies
            for (let i = 0; i < 25; i++) {
                this.particles.push(new SunnySparkle(this.w, this.h));
            }
        }
    }

    loop() {
        this.time++;
        this.ctx.clearRect(0, 0, this.w, this.h);

        // Render celestial elements
        if (this.type === 'clear' && !this.isNight) {
            this.drawSunRays();
        }

        // Process clouds first (behind rain/snow particles)
        this.clouds.forEach(cloud => {
            cloud.update();
            cloud.draw(this.ctx, document.documentElement.getAttribute('data-theme') || 'dark');
        });

        // Twinkle/Fall loops
        this.particles.forEach(p => {
            if (p instanceof TwinkleStar) {
                p.draw(this.ctx, this.time);
            } else if (p instanceof RainDrop) {
                const hit = p.update();
                if (hit) {
                    if (this.splashes.length < 50) {
                        this.splashes.push(new RainSplash(p.x, this.h));
                    }
                    p.reset();
                }
                p.draw(this.ctx);
            } else if (p instanceof Snowflake) {
                p.update(this.time);
                p.draw(this.ctx);
            } else if (p instanceof SunnySparkle) {
                p.update();
                p.draw(this.ctx);
            }
        });

        // Draw and update splashes
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const dead = this.splashes[i].update();
            if (dead) {
                this.splashes.splice(i, 1);
            } else {
                this.splashes[i].draw(this.ctx);
            }
        }

        // Lightning flashes
        if (this.type === 'thunderstorm') {
            if (Math.random() < 0.004 && this.flashOpacity <= 0) {
                this.flashOpacity = 0.5 + Math.random() * 0.4;
            }
            if (this.flashOpacity > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashOpacity})`;
                this.ctx.fillRect(0, 0, this.w, this.h);
                this.flashOpacity -= 0.04; // rapid decay
            }
        }

        requestAnimationFrame(() => this.loop());
    }

    drawSunRays() {
        const cx = this.w * 0.85;
        const cy = this.h * 0.15;
        const radius = Math.max(this.w, this.h) * 0.7;
        const rayCount = 10;
        const step = (Math.PI * 2) / rayCount;
        const angleOffset = this.time * 0.0002;
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';

        this.ctx.fillStyle = theme === 'dark' ? 'rgba(251, 191, 36, 0.02)' : 'rgba(251, 191, 36, 0.05)';
        for (let i = 0; i < rayCount; i++) {
            const startAngle = angleOffset + i * step;
            const endAngle = startAngle + step * 0.35;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Core sun glow
        const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
        glow.addColorStop(0, theme === 'dark' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.25)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.beginPath();
        this.ctx.fillStyle = glow;
        this.ctx.arc(cx, cy, 180, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Particle Helper Subclasses
class RainDrop {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
        this.y = Math.random() * h;
    }
    reset() {
        this.x = Math.random() * this.w;
        this.y = -30;
        this.vy = 12 + Math.random() * 8;
        this.length = 15 + Math.random() * 20;
        this.opacity = 0.15 + Math.random() * 0.35;
    }
    update() {
        this.y += this.vy;
        return this.y > this.h - 10;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(156, 163, 175, ${this.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}

class RainSplash {
    constructor(x, y) {
        this.x = x;
        this.y = y - 5;
        this.r = 1;
        this.maxR = 3 + Math.random() * 5;
        this.opacity = 0.6;
    }
    update() {
        this.r += 0.4;
        this.opacity -= 0.05;
        return this.opacity <= 0;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(156, 163, 175, ${this.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.ellipse(this.x, this.y, this.r, this.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Snowflake {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
        this.y = Math.random() * h;
    }
    reset() {
        this.x = Math.random() * this.w;
        this.y = -10;
        this.r = 1.5 + Math.random() * 3;
        this.vy = 0.8 + Math.random() * 1.5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.opacity = 0.2 + Math.random() * 0.5;
        this.swingSpeed = 0.008 + Math.random() * 0.012;
        this.swingRange = 0.4 + Math.random() * 1.2;
    }
    update(time) {
        this.y += this.vy;
        this.x += this.vx + Math.sin(time * this.swingSpeed) * this.swingRange;
        if (this.y > this.h || this.x < -10 || this.x > this.w + 10) {
            this.reset();
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class SunnySparkle {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
        this.y = Math.random() * h;
    }
    reset() {
        this.x = Math.random() * this.w;
        this.y = this.h + 20;
        this.r = 0.6 + Math.random() * 1.2;
        this.vy = -(0.3 + Math.random() * 0.6);
        this.vx = (Math.random() - 0.5) * 0.25;
        this.opacity = 0.05 + Math.random() * 0.25;
        this.life = 0;
        this.maxLife = 250 + Math.random() * 250;
    }
    update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life++;
        this.opacity = Math.max(0, (1 - this.life / this.maxLife) * 0.3);
        if (this.y < -10 || this.life >= this.maxLife) {
            this.reset();
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(251, 191, 36, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class TwinkleStar {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = 0.5 + Math.random() * 1.2;
        this.twinkleSpeed = 0.015 + Math.random() * 0.035;
        this.phase = Math.random() * Math.PI * 2;
        this.baseOpacity = 0.15 + Math.random() * 0.55;
    }
    draw(ctx, time) {
        const opacity = Math.max(0.08, this.baseOpacity + Math.sin(time * this.twinkleSpeed + this.phase) * 0.25);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class DriftCloud {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset();
        this.x = Math.random() * w;
    }
    reset() {
        this.x = -250;
        this.y = Math.random() * (this.h * 0.35);
        this.r = 50 + Math.random() * 70;
        this.vx = 0.08 + Math.random() * 0.15;
        this.opacity = 0.06 + Math.random() * 0.06;
    }
    update() {
        this.x += this.vx;
        if (this.x > this.w + 250) {
            this.reset();
        }
    }
    draw(ctx, theme) {
        const fill = theme === 'dark' ? '255, 255, 255' : '107, 114, 128';
        ctx.beginPath();
        ctx.fillStyle = `rgba(${fill}, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.arc(this.x + this.r * 0.6, this.y - this.r * 0.15, this.r * 0.75, 0, Math.PI * 2);
        ctx.arc(this.x - this.r * 0.5, this.y - this.r * 0.1, this.r * 0.65, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}


// ==========================================================================
// CORE WEATHER DASHBOARD CLASS (AeroDashboard)
// ==========================================================================
class AeroDashboard {
    constructor() {
        // App State
        this.units = localStorage.getItem('aero_units') || 'metric'; // metric vs imperial
        this.theme = localStorage.getItem('aero_theme') || 'dark'; // dark vs light
        this.recents = JSON.parse(localStorage.getItem('aero_recents')) || [];
        this.currentCity = '';
        this.timezoneOffset = 0;
        this.clockInterval = null;
        
        // Cache objects to prevent duplicates
        this.weatherCache = null;
        this.forecastCache = null;
        this.aqiCache = null;
        this.uvCache = 0;
        
        // Chart management
        this.activeChartTab = 'temp';
        this.chartInstance = null;

        // Initialize helper engines
        this.bgCanvas = new WeatherCanvas();

        // Query DOM Elements
        this.initDOMElements();
        // Bind UI Events
        this.bindEvents();
        
        // Initial Theme Load
        this.applyTheme(this.theme);
        
        // Initial Data Fetch
        this.loadInitialCity();
    }

    initDOMElements() {
        this.locationInput = document.getElementById('locationInput');
        this.searchButton = document.getElementById('searchButton');
        this.suggestionsDropdown = document.getElementById('search-suggestions');
        this.recentsList = document.getElementById('recents-list');
        this.unitToggle = document.getElementById('unit-toggle');
        this.themeToggle = document.getElementById('theme-toggle');
        this.detectLocBtn = document.getElementById('location-detect-btn');
        this.popup = document.getElementById('popup');
    }

    bindEvents() {
        // Search trigger
        this.searchButton.addEventListener('click', () => this.handleSearch());
        this.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Search autocomplete events
        let debounceTimer;
        this.locationInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = this.locationInput.value.trim().toLowerCase();
            if (query.length < 2) {
                this.suggestionsDropdown.classList.add('hidden');
                return;
            }
            debounceTimer = setTimeout(() => this.showSuggestions(query), 150);
        });

        // Close suggestions dropdown on window click
        window.addEventListener('click', (e) => {
            if (!this.locationInput.contains(e.target) && !this.suggestionsDropdown.contains(e.target)) {
                this.suggestionsDropdown.classList.add('hidden');
            }
        });

        // Settings actions
        this.unitToggle.addEventListener('click', () => this.toggleUnits());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.detectLocBtn.addEventListener('click', () => this.detectUserLocation());

        // Chart tab clicks
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.activeChartTab = e.target.getAttribute('data-chart');
                this.renderAnalyticsChart();
            });
        });
    }

    // --- Core Data Loading Methods ---

    loadInitialCity() {
        // Try auto location detect or last recent search or default city
        if (this.recents.length > 0) {
            this.fetchWeather(this.recents[0]);
        } else {
            this.fetchWeather('London');
        }
        this.renderRecentsSidebar();
    }

    detectUserLocation() {
        if (!navigator.geolocation) {
            this.fallbackIPLocation();
            return;
        }

        this.showToast('Requesting GPS coordinates...', 'info');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                this.fetchWeatherByCoords(lat, lon);
            },
            async (err) => {
                console.warn("HTML5 Geolocation failed or timed out, trying IP fallback...", err);
                await this.fallbackIPLocation();
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000
            }
        );
    }

    async fallbackIPLocation() {
        this.showToast('Detecting location via IP address...', 'info');
        
        // Cascade 1: FreeIPAPI (very fast, no key, high limits)
        try {
            const response = await fetch('https://freeipapi.com/api/json');
            if (!response.ok) throw new Error('FreeIPAPI failed');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
                await this.fetchWeatherByCoords(data.latitude, data.longitude);
                this.showToast(`Located near: ${data.cityName || 'current region'}`, 'info');
                return;
            }
        } catch (err) {
            console.warn("FreeIPAPI fallback failed, trying ipapi.co...", err);
        }

        // Cascade 2: IPAPI.co
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('ipapi.co failed');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
                await this.fetchWeatherByCoords(data.latitude, data.longitude);
                this.showToast(`Located near: ${data.city || 'current region'}`, 'info');
                return;
            }
        } catch (err) {
            console.warn("ipapi.co fallback failed, trying ipinfo.io...", err);
        }

        // Cascade 3: IPInfo.io (uses coordinate string splitting)
        try {
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) throw new Error('ipinfo.io failed');
            const data = await response.json();
            
            if (data.loc) {
                const [lat, lon] = data.loc.split(',');
                await this.fetchWeatherByCoords(parseFloat(lat), parseFloat(lon));
                this.showToast(`Located near: ${data.city || 'current region'}`, 'info');
                return;
            }
        } catch (err) {
            console.error("All IP Geolocation cascade lookups failed:", err);
            this.showToast('Location detection failed. Loading London...', 'error');
            if (this.currentCity === '') this.fetchWeather('London');
        }
    }

    handleSearch() {
        const query = this.locationInput.value.trim();
        if (query) {
            this.fetchWeather(query);
            this.locationInput.value = '';
            this.suggestionsDropdown.classList.add('hidden');
        } else {
            this.showToast('Please enter a valid city name.', 'error');
        }
    }

    showSuggestions(query) {
        const matches = autocompleteCities.filter(city => 
            city.name.toLowerCase().includes(query) || 
            city.country.toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length === 0) {
            this.suggestionsDropdown.classList.add('hidden');
            return;
        }

        this.suggestionsDropdown.innerHTML = matches.map(city => `
            <div class="suggestion-item" data-search="${city.searchStr}">
                <span>${city.name}</span>
                <span class="suggestion-country">${city.country}</span>
            </div>
        `).join('');

        this.suggestionsDropdown.classList.remove('hidden');

        // Add selection listener
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetCity = e.currentTarget.getAttribute('data-search');
                this.fetchWeather(targetCity);
                this.locationInput.value = '';
                this.suggestionsDropdown.classList.add('hidden');
            });
        });
    }

    // --- Weather API Operations ---

    async fetchWeather(query) {
        this.showSkeletonLoading();
        const url = `${apiBase}weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('City not found');
            const data = await response.json();
            
            await this.processWeatherData(data);
        } catch (error) {
            console.error(error);
            this.showToast(`Error: ${error.message}. Please check spelling.`, 'error');
            this.hideSkeletonLoading();
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        this.showSkeletonLoading();
        const url = `${apiBase}weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Location not found');
            const data = await response.json();
            
            await this.processWeatherData(data);
        } catch (error) {
            console.error(error);
            this.showToast('Coordinates search failed.', 'error');
            this.hideSkeletonLoading();
        }
    }

    async processWeatherData(data) {
        this.weatherCache = data;
        this.currentCity = data.name;
        this.timezoneOffset = data.timezone;
        
        const lat = data.coord.lat;
        const lon = data.coord.lon;

        // Fetch Forecast & Air Pollution in parallel
        try {
            const [forecastRes, aqiRes] = await Promise.all([
                fetch(`${apiBase}forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
                fetch(`${apiBase}air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
            ]);

            if (forecastRes.ok) this.forecastCache = await forecastRes.json();
            if (aqiRes.ok) this.aqiCache = await aqiRes.json();
        } catch (err) {
            console.warn("Analytics or Air quality failed to fetch", err);
        }

        // Estimate UV index based on coordinate data
        this.uvCache = this.estimateUV(lat, data.clouds.all);

        // Save to recents search list
        this.saveToRecentSearches(data.name);

        // Hide Loading State & update components
        this.hideSkeletonLoading();
        this.updateDashboardUI();
    }

    // --- Dashboard UI Refresh Operations ---

    updateDashboardUI() {
        if (!this.weatherCache) return;

        const w = this.weatherCache;
        const f = this.forecastCache;
        const aqi = (this.aqiCache && this.aqiCache.list && this.aqiCache.list[0] && this.aqiCache.list[0].main) ? this.aqiCache.list[0].main.aqi : 3;

        // 1. Update Clock & Date
        this.startRealTimeClock(w.timezone);

        // 3. Hero Weather Card
        document.getElementById('location-name').textContent = w.name;
        document.getElementById('hero-temp').textContent = this.formatTemp(w.main.temp);
        document.getElementById('hero-description').textContent = w.weather[0].description;
        document.getElementById('hero-min-temp').textContent = `L: ${this.formatTemp(w.main.temp_min)}°`;
        document.getElementById('hero-max-temp').textContent = `H: ${this.formatTemp(w.main.temp_max)}°`;
        
        // Update condition icon in hero card
        const heroIconContainer = document.getElementById('hero-weather-icon');
        const iconCode = w.weather[0].icon;
        heroIconContainer.innerHTML = this.getWeatherSVG(iconCode);
        lucide.createIcons();

        // 4. Update Dynamic Background & Canvas Simulation
        const weatherGroup = w.weather[0].main.toLowerCase();
        let backgroundType = 'clear';
        
        if (weatherGroup.includes('cloud')) {
            backgroundType = 'clouds';
        } else if (weatherGroup.includes('rain') || weatherGroup.includes('drizzle')) {
            backgroundType = 'rain';
        } else if (weatherGroup.includes('thunderstorm')) {
            backgroundType = 'thunderstorm';
        } else if (weatherGroup.includes('snow')) {
            backgroundType = 'snow';
        }

        const isNight = this.checkNightState(w.sys.sunrise, w.sys.sunset);
        this.bgCanvas.setWeather(backgroundType, isNight);
        this.applyDynamicGradients(backgroundType, isNight);

        // 5. Update Today's Highlights Metrics
        this.updateHighlightsMetrics(w, aqi);

        // 6. Update Forecast Lists
        if (f) {
            this.renderHourlyForecast(f);
            this.renderWeeklyForecast(f);
            this.renderAnalyticsChart();
        }

        // 7. Activity widgets & AI recommendations
        this.renderLifestyleActivities(w, aqi, this.uvCache);
        this.generateAIInsights(w, f, aqi, this.uvCache);

        // 8. Fact Card update
        const randomFact = weatherFacts[Math.floor(Math.random() * weatherFacts.length)];
        document.getElementById('weather-fact').textContent = randomFact;
    }

    updateHighlightsMetrics(w, aqiVal) {
        // Feels like
        const feelsLike = w.main.feels_like;
        document.getElementById('val-feels-like').textContent = `${this.formatTemp(feelsLike)}°`;
        
        let feelsDesc = "Feels like actual temperature.";
        const diff = feelsLike - w.main.temp;
        if (diff > 2) feelsDesc = "Humid air makes it feel warmer.";
        else if (diff < -2) feelsDesc = "Wind chill makes it feel colder.";
        document.getElementById('desc-feels-like').textContent = feelsDesc;

        // Humidity
        const hum = w.main.humidity;
        document.getElementById('val-humidity').textContent = `${hum}%`;
        document.getElementById('fill-humidity').style.width = `${hum}%`;
        
        let humDesc = "Dry air, highly comfortable.";
        if (hum > 75) humDesc = "Slightly sticky atmosphere.";
        else if (hum > 50) humDesc = "Moderate ambient moisture.";
        document.getElementById('desc-humidity').textContent = humDesc;

        // Wind speed & compass rotation
        const speed = w.wind.speed; // m/s
        const displaySpeed = this.units === 'metric' ? `${speed.toFixed(1)} m/s` : `${(speed * 2.23694).toFixed(1)} mph`;
        document.getElementById('val-wind').textContent = displaySpeed;
        
        const deg = w.wind.deg || 0;
        const arrow = document.querySelector('.compass-needle');
        if (arrow) arrow.style.transform = `rotate(${deg}deg)`;
        
        document.getElementById('desc-wind').textContent = `Direction: ${deg}° (${this.getWindDirectionText(deg)})`;

        // Air Quality
        const aqiLabels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
        const aqiOffsets = ["5%", "25%", "50%", "75%", "95%"];
        const aqiDescs = [
            "Fresh clean air. Perfect for outside exercises.",
            "Acceptable air quality for generic routines.",
            "Sensitive groups might encounter mild irritation.",
            "Unhealthy pollution. Limit prolonged outdoor stays.",
            "Hazardous air. Try to remain inside today."
        ];
        
        const index = Math.min(5, Math.max(1, aqiVal)) - 1;
        document.getElementById('val-aqi').textContent = aqiLabels[index];
        document.getElementById('fill-aqi').style.left = aqiOffsets[index];
        document.getElementById('desc-aqi').textContent = aqiDescs[index];

        // UV Index
        document.getElementById('val-uv').textContent = this.uvCache;
        const uvPercent = Math.min(100, (this.uvCache / 11) * 100);
        document.getElementById('fill-uv').style.width = `${uvPercent}%`;
        
        let uvDesc = "Low danger level. No precautions needed.";
        if (this.uvCache >= 8) uvDesc = "Very high risk. Seek shade, wear SPF 30+.";
        else if (this.uvCache >= 6) uvDesc = "High risk. Wear sunglasses, SPF, and hats.";
        else if (this.uvCache >= 3) uvDesc = "Moderate risk. Sun protection is advised.";
        document.getElementById('desc-uv').textContent = uvDesc;

        // Visibility
        const vis = w.visibility / 1000; // km
        const displayVis = this.units === 'metric' ? `${vis.toFixed(1)} km` : `${(vis / 1.60934).toFixed(1)} mi`;
        document.getElementById('val-visibility').textContent = displayVis;
        document.getElementById('fill-visibility').style.width = `${Math.min(100, (w.visibility / 10000) * 100)}%`;
        
        let visDesc = "Perfect visibility conditions.";
        if (vis < 2) visDesc = "Heavy fog / hazard visibility.";
        else if (vis < 6) visDesc = "Moderate visual haze present.";
        document.getElementById('desc-visibility').textContent = visDesc;

        // Pressure
        const press = w.main.pressure;
        document.getElementById('val-pressure').textContent = `${press} hPa`;
        
        let pressDesc = "Standard atmospheric pressure.";
        if (press > 1020) pressDesc = "High pressure bringing stable weather.";
        else if (press < 1009) pressDesc = "Low pressure. Storm systems likely.";
        document.getElementById('desc-pressure').textContent = pressDesc;

        // Dew point estimation
        const dew = w.main.temp - ((100 - hum) / 5);
        document.getElementById('val-dewpoint').textContent = `${this.formatTemp(dew)}°`;
        
        let dewDesc = "Dew point matches dry comfort range.";
        if (dew > 20) dewDesc = "Extremely sticky and high humidity.";
        else if (dew > 13) dewDesc = "Noticeable humidity in the air.";
        document.getElementById('desc-dewpoint').textContent = dewDesc;

        // Sunrise & Sunset paths
        const currentUTC = Math.floor(Date.now() / 1000);
        const localUTC = currentUTC + w.timezone;
        this.updateSunProgress(w.sys.sunrise, w.sys.sunset, currentUTC, w.timezone);
    }

    updateSunProgress(sunrise, sunset, nowSec, timezone) {
        // Format absolute time labels
        const formatTime = (ts) => {
            const date = new Date((ts) * 1000);
            const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
            const cityDate = new Date(utc + (timezone * 1000));
            return cityDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        };

        document.getElementById('sun-sunrise').textContent = formatTime(sunrise);
        document.getElementById('sun-sunset').textContent = formatTime(sunset);

        const trackerText = document.getElementById('sun-time-remaining');
        const sunNode = document.getElementById('sun-node');
        const progressPath = document.getElementById('sun-path-progress');

        const totalDaylight = sunset - sunrise;
        const elapsedDaylight = nowSec - sunrise;
        
        let ratio = 0;
        if (nowSec > sunrise && nowSec < sunset) {
            ratio = elapsedDaylight / totalDaylight;
            const remainingMin = Math.floor((sunset - nowSec) / 60);
            const h = Math.floor(remainingMin / 60);
            const m = remainingMin % 60;
            trackerText.textContent = `${h}h ${m}m remaining until Sunset`;
        } else if (nowSec >= sunset) {
            ratio = 1;
            const nextSunrise = sunrise + 86400; // rough tomorrow
            const untilSunrise = Math.floor((nextSunrise - nowSec) / 60);
            const h = Math.max(0, Math.floor(untilSunrise / 60));
            const m = Math.max(0, untilSunrise % 60);
            trackerText.textContent = `Sunrise in approximately ${h}h ${m}m`;
        } else {
            ratio = 0;
            const untilSunrise = Math.floor((sunrise - nowSec) / 60);
            const h = Math.max(0, Math.floor(untilSunrise / 60));
            const m = Math.max(0, untilSunrise % 60);
            trackerText.textContent = `Sunrise in approximately ${h}h ${m}m`;
        }

        // Move the sun node on the SVG arc
        // Path formula coordinates:
        // cx = 50 + 45 * cos(theta), cy = 45 - 40 * sin(theta) where theta is between PI (180deg) to 0 (0deg)
        const theta = Math.PI - (ratio * Math.PI);
        const cx = 50 + 45 * Math.cos(theta);
        const cy = 45 - 40 * Math.sin(theta);
        
        sunNode.setAttribute('cx', cx);
        sunNode.setAttribute('cy', cy);

        // Adjust SVG stroke dash offset
        const totalLength = progressPath.getTotalLength();
        progressPath.style.strokeDasharray = totalLength;
        progressPath.style.strokeDashoffset = totalLength - (ratio * totalLength);
    }

    renderHourlyForecast(f) {
        const container = document.getElementById('hourly-forecast-list');
        container.innerHTML = '';

        // Take first 8 reports (24 hours at 3h intervals)
        const hourlyReports = f.list.slice(0, 8);

        hourlyReports.forEach(item => {
            const date = new Date(item.dt * 1000);
            const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
            const localDate = new Date(utc + (f.city.timezone * 1000));
            
            let timeStr = localDate.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            // Strip out 0 minutes
            timeStr = timeStr.replace(':00', '');

            const card = document.createElement('div');
            card.className = 'hourly-card glass';
            
            const prob = item.pop ? Math.round(item.pop * 100) : 0;
            const probText = prob > 15 ? `<span class="rain-prob">${prob}%</span>` : '';

            card.innerHTML = `
                <span class="time">${timeStr}</span>
                <div class="hourly-icon">${this.getWeatherSVG(item.weather[0].icon)}</div>
                <span class="temp">${this.formatTemp(item.main.temp)}°</span>
                ${probText}
            `;
            container.appendChild(card);
        });
        lucide.createIcons();
    }

    renderWeeklyForecast(f) {
        const container = document.getElementById('weekly-forecast-list');
        container.innerHTML = '';

        // Group the 40 forecast points by calendar date
        const dailyData = {};
        
        f.list.forEach(item => {
            const dateObj = new Date(item.dt * 1000);
            const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
            const localDate = new Date(utc + (f.city.timezone * 1000));
            const dayKey = localDate.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            
            dailyData[dayKey].temps.push(item.main.temp);
            dailyData[dayKey].icons.push(item.weather[0].icon);
            dailyData[dayKey].descriptions.push(item.weather[0].description);
        });

        const dayKeys = Object.keys(dailyData);

        dayKeys.forEach(day => {
            const temps = dailyData[day].temps;
            const minTemp = Math.min(...temps);
            const maxTemp = Math.max(...temps);
            
            // Choose the mid-day icon for representational consistency
            const midIndex = Math.floor(dailyData[day].icons.length / 2);
            const icon = dailyData[day].icons[midIndex];
            const desc = dailyData[day].descriptions[midIndex];

            const row = document.createElement('div');
            row.className = 'weekly-row';
            row.innerHTML = `
                <span class="day">${day}</span>
                <div class="week-icon">${this.getWeatherSVG(icon)}</div>
                <span class="condition">${desc}</span>
                <div class="temp-range">
                    <span class="min">${this.formatTemp(minTemp)}°</span>
                    <span>/</span>
                    <span class="max">${this.formatTemp(maxTemp)}°</span>
                </div>
            `;
            container.appendChild(row);
        });
        lucide.createIcons();
    }

    renderLifestyleActivities(w, aqiVal, uvVal) {
        const temp = w.main.temp;
        const wind = w.wind.speed;
        const hum = w.main.humidity;
        const clouds = w.clouds.all;
        const isRain = w.weather[0].main.toLowerCase().includes('rain') || w.weather[0].main.toLowerCase().includes('drizzle');
        const isSnow = w.weather[0].main.toLowerCase().includes('snow');

        // Scoring rules for activities (higher = better)
        const calculateScores = () => {
            let running = 100;
            if (temp < 10 || temp > 28) running -= Math.abs(temp - 18) * 4;
            if (isRain) running -= 50;
            if (isSnow) running -= 70;
            running -= wind * 4;
            running -= (aqiVal > 3 ? (aqiVal - 3) * 20 : 0);

            let cycling = 100;
            if (temp < 12 || temp > 30) cycling -= Math.abs(temp - 20) * 3;
            if (isRain) cycling -= 60;
            if (isSnow) cycling -= 80;
            cycling -= wind * 8; // high drag index
            cycling -= (aqiVal > 3 ? (aqiVal - 3) * 15 : 0);

            let hiking = 100;
            if (temp < 8 || temp > 24) hiking -= Math.abs(temp - 15) * 4;
            if (isRain) hiking -= 70;
            if (isSnow) hiking -= 90;
            hiking -= wind * 5;
            hiking -= (w.visibility < 5000 ? 30 : 0);

            let photography = 100;
            // Scenic clouds are nice, empty white or grey skies are boring
            if (clouds < 15 || clouds > 85) photography -= 20;
            if (isRain) photography -= 40;
            if (w.visibility < 3000) photography -= 50;

            let driving = 100;
            if (w.visibility < 1000) driving -= 70; // fog danger
            else if (w.visibility < 4000) driving -= 30;
            if (isRain) driving -= 15;
            if (isSnow) driving -= 50;
            if (wind > 18) driving -= 30;

            let beach = 100;
            if (temp < 24) beach -= (24 - temp) * 8;
            beach -= clouds * 0.7;
            if (isRain || isSnow) beach -= 90;
            beach -= wind * 3;

            return { running, cycling, hiking, photography, driving, beach };
        };

        const scores = calculateScores();

        const getBadge = (score) => {
            if (score >= 75) return { text: 'Ideal', class: 'status-ideal' };
            if (score >= 45) return { text: 'Moderate', class: 'status-moderate' };
            return { text: 'Poor', class: 'status-poor' };
        };

        const keys = Object.keys(scores);
        keys.forEach(k => {
            const badgeObj = getBadge(scores[k]);
            const badgeEl = document.getElementById(`act-${k}`);
            badgeEl.className = `activity-status ${badgeObj.class}`;
            badgeEl.textContent = badgeObj.text;
        });
    }

    generateAIInsights(w, f, aqi, uv) {
        const desc = w.weather[0].description.toLowerCase();
        const mainDesc = w.weather[0].main.toLowerCase();
        const temp = w.main.temp;
        let bullets = [];

        // Dynamic Warnings
        if (mainDesc.includes('rain') || mainDesc.includes('drizzle') || mainDesc.includes('thunderstorm')) {
            bullets.push("Precipitation is actively falling. Carry an umbrella and plan for wet transit conditions.");
        } else if (f) {
            // Find rain in next 12 hours (first 4 items)
            const rainAhead = f.list.slice(0, 4).find(item => item.weather[0].main.toLowerCase().includes('rain'));
            if (rainAhead) {
                const hour = new Date(rainAhead.dt * 1000).getHours();
                const ampm = hour >= 12 ? 'PM' : 'AM';
                bullets.push(`Rain is forecasted in your area starting around ${hour % 12 || 12} ${ampm}. Carry gear.`);
            }
        }

        // UV exposure
        if (uv >= 6) {
            bullets.push("Extreme solar index today. Apply SPF 30+, wear shades, and seek midday shade.");
        } else if (uv >= 3) {
            bullets.push("Moderate solar index. UV protection is recommended for extended outdoor visits.");
        }

        // AQI warning
        if (aqi >= 4) {
            bullets.push("Poor air quality index. Restrict heavy physical workouts outdoors.");
        }

        // Lifestyle/General quotes
        if (temp > 28) {
            bullets.push("Warm ambient temperatures. Keep hydrated and check air-conditioned destinations.");
        } else if (temp < 6) {
            bullets.push("Cold temperature conditions. Bundle up in layers to conserve body temperature.");
        } else if (temp >= 14 && temp <= 23 && !mainDesc.includes('rain') && w.wind.speed < 6) {
            bullets.push("Pleasant temperature and low wind. Excellent window of opportunity for jogging or hiking.");
        }

        // Fallback
        if (bullets.length === 0) {
            bullets.push("Atmospheric conditions are stable and balanced. Enjoy your regular schedule!");
        }

        // Render bullets list
        const textContainer = document.getElementById('ai-insight-text');
        textContainer.innerHTML = bullets.map(text => `
            <div class="insight-bullet">
                <i data-lucide="sparkles" class="bullet-icon"></i>
                <span>${text}</span>
            </div>
        `).join('');
        lucide.createIcons();
    }

    // --- Chart.js Visualization Builder ---

    renderAnalyticsChart() {
        const ctx = document.getElementById('analyticsChart').getContext('2d');
        if (!this.forecastCache) return;

        // Destroy previous instance to avoid layout leak
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Prep data: 24h forecast (8 points)
        const forecastReports = this.forecastCache.list.slice(0, 8);
        const labels = forecastReports.map(item => {
            const date = new Date(item.dt * 1000);
            const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
            const localDate = new Date(utc + (this.forecastCache.city.timezone * 1000));
            let str = localDate.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            return str.replace(':00', '');
        });

        let chartData = [];
        let datasetLabel = '';
        let borderClr = '#3b82f6';
        let gradientClrStart = 'rgba(59, 130, 246, 0.25)';
        let chartType = 'line';

        switch(this.activeChartTab) {
            case 'temp':
                chartData = forecastReports.map(item => {
                    const t = item.main.temp;
                    return this.units === 'metric' ? Math.round(t) : Math.round((t * 9/5) + 32);
                });
                datasetLabel = this.units === 'metric' ? 'Temp (°C)' : 'Temp (°F)';
                borderClr = '#fbbf24';
                gradientClrStart = 'rgba(251, 191, 36, 0.25)';
                break;
            case 'rain':
                chartData = forecastReports.map(item => Math.round((item.pop || 0) * 100));
                datasetLabel = 'Rain Prob (%)';
                borderClr = '#3b82f6';
                gradientClrStart = 'rgba(59, 130, 246, 0.35)';
                chartType = 'bar';
                break;
            case 'wind':
                chartData = forecastReports.map(item => {
                    const s = item.wind.speed;
                    return this.units === 'metric' ? Number(s.toFixed(1)) : Number((s * 2.23694).toFixed(1));
                });
                datasetLabel = this.units === 'metric' ? 'Wind Speed (m/s)' : 'Wind Speed (mph)';
                borderClr = '#10b981';
                gradientClrStart = 'rgba(16, 185, 129, 0.2)';
                break;
            case 'humidity':
                chartData = forecastReports.map(item => item.main.humidity);
                datasetLabel = 'Humidity (%)';
                borderClr = '#a855f7';
                gradientClrStart = 'rgba(168, 85, 247, 0.25)';
                break;
        }

        // Configure Chart colors depending on dark/light themes
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        const labelColor = theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        // Gradient generator
        const grad = ctx.createLinearGradient(0, 0, 0, 220);
        grad.addColorStop(0, gradientClrStart);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: chartData,
                    borderColor: borderClr,
                    backgroundColor: chartType === 'bar' ? borderClr : grad,
                    fill: chartType === 'line',
                    tension: 0.35,
                    borderWidth: 2,
                    borderRadius: chartType === 'bar' ? 6 : 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }

    // --- Sidebar & State Helpers ---

    saveToRecentSearches(city) {
        // Exclude and add to front
        this.recents = this.recents.filter(c => c !== city);
        this.recents.unshift(city);
        
        if (this.recents.length > 5) {
            this.recents.pop();
        }

        localStorage.setItem('aero_recents', JSON.stringify(this.recents));
        this.renderRecentsSidebar();
    }

    // --- Sidebar & State Helpers ---

    renderRecentsSidebar() {
        if (this.recents.length === 0) {
            this.recentsList.innerHTML = '<div class="empty-state">No recent searches</div>';
            return;
        }

        this.recentsList.innerHTML = '';
        this.recents.forEach(city => {
            const item = document.createElement('div');
            item.className = 'recent-city-item';
            item.innerHTML = `
                <div class="city-info-block">
                    <span class="name">${city}</span>
                </div>
                <i data-lucide="history" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
            `;
            item.addEventListener('click', () => this.fetchWeather(city));
            this.recentsList.appendChild(item);
        });
        lucide.createIcons();
    }

    // --- Utility Methods ---

    toggleUnits() {
        this.units = this.units === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('aero_units', this.units);
        
        // Update label text
        const label = this.unitToggle.querySelector('.unit-label');
        label.textContent = this.units === 'metric' ? 'Metric (°C)' : 'Imperial (°F)';
        
        // Redraw Dashboard elements with converted units without calling API!
        this.updateDashboardUI();
        this.showToast(`Switched metric system to ${this.units}`, 'info');
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('aero_theme', this.theme);
        this.applyTheme(this.theme);
        this.showToast(`Switched to ${this.theme} mode`, 'info');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Redraw chart to update grids/text color
        if (this.forecastCache) {
            this.renderAnalyticsChart();
        }
    }

    applyDynamicGradients(type, isNight) {
        const overlay = document.getElementById('theme-overlay');
        let grad = 'linear-gradient(135deg, #0b111e 0%, #05070c 100%)'; // default dark

        if (this.theme === 'light') {
            if (isNight) {
                grad = 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)';
            } else if (type === 'rain' || type === 'thunderstorm') {
                grad = 'linear-gradient(135deg, #8d99ae 0%, #2b2d42 100%)';
            } else if (type === 'clouds') {
                grad = 'linear-gradient(135deg, #d3d3d3 0%, #90a4ae 100%)';
            } else if (type === 'snow') {
                grad = 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)';
            } else {
                grad = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'; // bright sky
            }
        } else {
            // Dark Mode gradients
            if (isNight) {
                grad = 'linear-gradient(135deg, #030712 0%, #0c101d 100%)';
            } else if (type === 'rain' || type === 'thunderstorm') {
                grad = 'linear-gradient(135deg, #0f1622 0%, #07090d 100%)';
            } else if (type === 'clouds') {
                grad = 'linear-gradient(135deg, #111a2e 0%, #080c16 100%)';
            } else if (type === 'snow') {
                grad = 'linear-gradient(135deg, #162438 0%, #0a111a 100%)';
            } else {
                grad = 'linear-gradient(135deg, #0b182e 0%, #050a14 100%)'; // clear sun dark
            }
        }
        overlay.style.background = grad;
    }

    startRealTimeClock(timezoneOffset) {
        if (this.clockInterval) clearInterval(this.clockInterval);

        const runClock = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const local = new Date(utc + (timezoneOffset * 1000));
            
            // Time string format
            const timeStr = local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            document.getElementById('realtime-clock').textContent = timeStr;

            // Date string format
            const dateStr = local.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
            document.getElementById('current-date').textContent = dateStr;
        };

        runClock();
        this.clockInterval = setInterval(runClock, 1000);
    }

    checkNightState(sunrise, sunset) {
        const currentUTC = Math.floor(Date.now() / 1000);
        return currentUTC < sunrise || currentUTC > sunset;
    }

    formatTemp(celsius) {
        if (this.units === 'metric') {
            return Math.round(celsius);
        } else {
            return Math.round((celsius * 9/5) + 32);
        }
    }

    estimateUV(lat, clouds) {
        const hour = new Date().getHours();
        // Solar intensity is highest around noon (12:00)
        const intensity = Math.max(0, 1 - Math.pow(Math.abs(hour - 12) / 6, 2));
        // Lat factor: equator gets 12 max, poles get less
        const latRatio = Math.cos(lat * Math.PI / 180);
        const baseUV = 11.5 * latRatio * intensity;
        // Clouds decrease UV exposure
        const cloudFactor = 1 - (clouds / 100) * 0.75;
        return Math.max(0, Math.round(baseUV * cloudFactor * 10) / 10);
    }

    getWindDirectionText(deg) {
        const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const index = Math.round(((deg % 360) / 45)) % 8;
        return directions[index];
    }

    showToast(message, type = 'info') {
        this.popup.textContent = message;
        this.popup.className = `popup-alert glass show ${type === 'error' ? 'alert-error' : 'alert-info'}`;
        
        setTimeout(() => {
            this.popup.classList.remove('show');
        }, 3000);
    }

    showSkeletonLoading() {
        document.querySelectorAll('.card-reveal').forEach(el => {
            el.classList.add('shimmer-card');
        });
    }

    hideSkeletonLoading() {
        document.querySelectorAll('.card-reveal').forEach(el => {
            el.classList.remove('shimmer-card');
        });
    }

    // --- Weather Vector Icons Loader (Lucide tags inside) ---
    getWeatherSVG(code) {
        // Map openweather icon codes to lucide tags
        switch(code) {
            case '01d': return '<i data-lucide="sun"></i>';
            case '01n': return '<i data-lucide="moon"></i>';
            case '02d': return '<i data-lucide="cloud-sun"></i>';
            case '02n': return '<i data-lucide="cloud-moon"></i>';
            case '03d':
            case '03n':
            case '04d':
            case '04n': return '<i data-lucide="cloud"></i>';
            case '09d':
            case '09n': return '<i data-lucide="cloud-drizzle"></i>';
            case '10d': return '<i data-lucide="cloud-rain-wind"></i>';
            case '10n': return '<i data-lucide="cloud-rain"></i>';
            case '11d':
            case '11n': return '<i data-lucide="cloud-lightning"></i>';
            case '13d':
            case '13n': return '<i data-lucide="snowflake"></i>';
            case '50d':
            case '50n': return '<i data-lucide="cloud-fog"></i>';
            default: return '<i data-lucide="cloud-sun"></i>';
        }
    }
}

// Instantiate dashboard on DOM content load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AeroDashboard();
});