/**
 * Geographic helper to provide default coordinates for various cities in India.
 * This ensures properties appear on the map even if specific coordinates aren't provided.
 */

const CITY_COORDINATES = {
    // Tamil Nadu
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'madras': { lat: 13.0827, lng: 80.2707 },
    'salem': { lat: 11.6643, lng: 78.1460 },
    'coimbatore': { lat: 11.0168, lng: 76.9558 },
    'madurai': { lat: 9.9252, lng: 78.1198 },
    'trichy': { lat: 10.7905, lng: 78.7047 },
    'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
    'erode': { lat: 11.3410, lng: 77.7172 },
    'tiruppur': { lat: 11.1085, lng: 77.3411 },
    'vellore': { lat: 12.9165, lng: 79.1325 },
    'thanjavur': { lat: 10.7852, lng: 79.1391 },
    'tirunelveli': { lat: 8.7139, lng: 77.7567 },
    'tuticorin': { lat: 8.8053, lng: 78.1460 },
    'thoothukudi': { lat: 8.8053, lng: 78.1460 },
    'hosur': { lat: 12.7409, lng: 77.8253 },
    'namakkal': { lat: 11.2189, lng: 78.1673 },
    'karur': { lat: 10.9601, lng: 78.0766 },
    'dindigul': { lat: 10.3673, lng: 77.9803 },
    'kanyakumari': { lat: 8.0883, lng: 77.5385 },
    'pondicherry': { lat: 11.9416, lng: 79.8083 },
    'kanchipuram': { lat: 12.8342, lng: 79.7036 },
    'ecr': { lat: 12.8230, lng: 80.2443 }, // East Coast Road specialized coords

    // Karnataka
    'bengaluru': { lat: 12.9716, lng: 77.5946 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'mysore': { lat: 12.2958, lng: 76.6394 },
    'mysuru': { lat: 12.2958, lng: 76.6394 },
    'mangalore': { lat: 12.9141, lng: 74.8560 },
    'mangaluru': { lat: 12.9141, lng: 74.8560 },
    'hubli': { lat: 15.3647, lng: 75.1240 },
    'belgaum': { lat: 15.8497, lng: 74.4977 },

    // Andhra & Telangana
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'vijayawada': { lat: 16.5062, lng: 80.6480 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'vizag': { lat: 17.6868, lng: 83.2185 },
    'tirupati': { lat: 13.6288, lng: 79.4192 },

    // Kerala
    'kochi': { lat: 9.9312, lng: 76.2673 },
    'cochin': { lat: 9.9312, lng: 76.2673 },
    'trivandrum': { lat: 8.5241, lng: 76.9366 },
    'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'calicut': { lat: 11.2588, lng: 75.7804 },
    'kozhikode': { lat: 11.2588, lng: 75.7804 },

    // Others
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'new delhi': { lat: 28.6139, lng: 77.2090 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'calcutta': { lat: 22.5726, lng: 88.3639 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'goa': { lat: 15.2993, lng: 74.1240 },
    'panaji': { lat: 15.4909, lng: 73.8278 },
    'ooty': { lat: 11.4102, lng: 76.6991 },
    'manali': { lat: 32.2432, lng: 77.1892 },
    'shimla': { lat: 31.1048, lng: 77.1734 },
    'udaipur': { lat: 24.5854, lng: 73.7125 }
};

/**
 * Assigns default coordinates to a hotel object if missing or zero.
 * Uses a small random offset to prevent overlap of multiple hotels in the same city.
 */
const assignDefaultCoordinates = (hotel) => {
    // Robust check for missing or zero coordinates
    const lat = parseFloat(hotel.latitude);
    const lng = parseFloat(hotel.longitude);
    
    const isMissingLat = isNaN(lat) || lat === 0;
    const isMissingLng = isNaN(lng) || lng === 0;

    if (isMissingLat || isMissingLng) {
        const cityName = (hotel.city || hotel.district || '').trim().toLowerCase();
        
        // Find best match in our database (fuzzy match)
        let matchedCity = Object.keys(CITY_COORDINATES).find(c => cityName === c);
        if (!matchedCity) {
            matchedCity = Object.keys(CITY_COORDINATES).find(c => cityName.includes(c) || c.includes(cityName));
        }

        if (matchedCity) {
            const cityData = CITY_COORDINATES[matchedCity];
            // Add a small random jitter (approx 2-5km) to prevent overlapping markers
            const jitterLat = (Math.random() - 0.5) * 0.04;
            const jitterLng = (Math.random() - 0.5) * 0.04;
            
            hotel.latitude = cityData.lat + jitterLat;
            hotel.longitude = cityData.lng + jitterLng;
            // console.log(`Smart Allocation: ${hotel.name} -> ${matchedCity} [${hotel.latitude}, ${hotel.longitude}]`);
        } else {
            // Fallback: Default to a coordinate within India (Nagpur/Center area) if city unknown
            // This prevents markers from appearing in Africa/Null Island (0,0)
            const fallbackLat = 21.1458; 
            const fallbackLng = 79.0882;
            const jitter = (Math.random() - 0.5) * 3; // Wider spread for unknown cities
            
            hotel.latitude = fallbackLat + jitter;
            hotel.longitude = fallbackLng + jitter;
        }
    }
    return hotel;
};

module.exports = { assignDefaultCoordinates, CITY_COORDINATES };
