/**
 * Geographic helper to provide default coordinates for various cities in India.
 * This ensures properties appear on the map even if specific coordinates aren't provided.
 */

const CITY_COORDINATES = {
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Goa': { lat: 15.2993, lng: 74.1240 },
    'Ooty': { lat: 11.4102, lng: 76.6991 },
    'Coimbatore': { lat: 11.0168, lng: 76.9558 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
    'Kanyakumari': { lat: 8.0883, lng: 77.5385 },
    'Pondicherry': { lat: 11.9416, lng: 79.8083 },
    'Manali': { lat: 32.2432, lng: 77.1892 },
    'Shimla': { lat: 31.1048, lng: 77.1734 },
    'Udaipur': { lat: 24.5854, lng: 73.7125 }
};

/**
 * Assigns default coordinates to a hotel object if missing or zero.
 * Uses a small random offset to prevent overlap of multiple hotels in the same city.
 */
const assignDefaultCoordinates = (hotel) => {
    if ((!hotel.latitude || hotel.latitude === 0) || (!hotel.longitude || hotel.longitude === 0)) {
        const city = Object.keys(CITY_COORDINATES).find(
            c => c.toLowerCase() === (hotel.city || '').toLowerCase()
        );

        if (city) {
            const base = CITY_COORDINATES[city];
            // Add a small random jitter (approx 2-5km)
            const jitterLat = (Math.random() - 0.5) * 0.04;
            const jitterLng = (Math.random() - 0.5) * 0.04;
            
            hotel.latitude = base.lat + jitterLat;
            hotel.longitude = base.lng + jitterLng;
            // console.log(`Assigned smart coordinates to ${hotel.name} in ${city}: [${hotel.latitude}, ${hotel.longitude}]`);
        } else {
            // Default to India center if city not found
            hotel.latitude = 20.5937 + (Math.random() - 0.5) * 2;
            hotel.longitude = 78.9629 + (Math.random() - 0.5) * 2;
        }
    }
    return hotel;
};

module.exports = { assignDefaultCoordinates, CITY_COORDINATES };
