import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet marker assets for Vite.
const restaurantIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = new L.DivIcon({
  className: 'apnamaal-user-marker',
  html: '<div style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:#2563eb;box-shadow:0 1px 8px #0006"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const DEFAULT_CENTER = [28.6139, 77.209]

function FitMapToMarkers({ points }) {
  const map = useMap()

  useMemo(() => {
    if (points.length === 1) {
      map.setView(points[0], 14)
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [35, 35], maxZoom: 14 })
    }
  }, [map, points])

  return null
}

export default function RestaurantMap({
  restaurants = [],
  height = '520px',
  showUserLocation = true,
}) {
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')

  const validRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) => {
        const lat = Number(restaurant?.location?.latitude)
        const lng = Number(restaurant?.location?.longitude)
        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180 &&
          !(lat === 0 && lng === 0)
        )
      }),
    [restaurants]
  )

  const points = useMemo(
    () =>
      validRestaurants.map((restaurant) => [
        Number(restaurant.location.latitude),
        Number(restaurant.location.longitude),
      ]),
    [validRestaurants]
  )

  function findMyLocation() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserLocation([coords.latitude, coords.longitude]),
      (error) => {
        if (error.code === 1) {
          setLocationError('Location permission denied. Please allow location access in your browser.')
        } else if (error.code === 2) {
          setLocationError('Your current location could not be determined.')
        } else {
          setLocationError('Location request timed out. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Restaurants on map</h2>
          <p className="mt-1 text-sm text-gray-500">
            {validRestaurants.length} restaurant locations available
          </p>
        </div>
        {showUserLocation && (
          <button
            type="button"
            onClick={findMyLocation}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            📍 Find my location
          </button>
        )}
      </div>

      {locationError && <p className="px-4 pb-3 text-sm text-red-600">{locationError}</p>}
      {validRestaurants.length === 0 && (
        <p className="px-4 pb-3 text-sm text-amber-700">
          No valid GPS coordinates found in the restaurants currently loaded.
        </p>
      )}

      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={points[0] || DEFAULT_CENTER}
          zoom={11}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMapToMarkers points={points} />

          {validRestaurants.map((restaurant) => (
            <Marker
              key={restaurant._id || restaurant.id}
              position={[
                Number(restaurant.location.latitude),
                Number(restaurant.location.longitude),
              ]}
              icon={restaurantIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-gray-900">
                    {restaurant.name || 'Restaurant'}
                  </h3>
                  {restaurant.cuisine && (
                    <p className="mt-1 text-sm text-gray-600">{restaurant.cuisine}</p>
                  )}
                  {restaurant.address?.street && (
                    <p className="mt-1 text-xs text-gray-500">{restaurant.address.street}</p>
                  )}
                  {restaurant.address?.city && (
                    <p className="text-xs text-gray-500">
                      {restaurant.address.city}
                      {restaurant.address?.state ? `, ${restaurant.address.state}` : ''}
                    </p>
                  )}
                  {restaurant.rating > 0 && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      ★ {restaurant.rating}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>Your current location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </section>
  )
}
