import React, { useState, useEffect } from 'react'
import { useModal } from '../context/ModalContext'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const parseDMS = (coord) => {
  if (typeof coord === 'number') return coord;
  const val = parseFloat(coord);
  return isNaN(val) ? 0 : val;
};

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

export default function Home() {

  const { showAlert } = useModal()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [nearMe, setNearMe] = useState(false)
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]) // Dhaka default
  const [requestedItems, setRequestedItems] = useState([])

  // ✅ DEMO DATA (5 items)
  const demoFoods = [
    {
      _id: "1",
      foodName: "Cooked Rice",
      quantity: 50,
      expiryTime: new Date(Date.now() + 3600000),
      isExpired: false,
      providerId: {
        name: "Green Restaurant",
        location: { lat: 23.8103, lng: 90.4125 }
      }
    },
    {
      _id: "2",
      foodName: "Fresh Bread",
      quantity: 30,
      expiryTime: new Date(Date.now() + 7200000),
      isExpired: false,
      providerId: {
        name: "Daily Bakery",
        location: { lat: 23.8150, lng: 90.4200 }
      }
    },
    {
      _id: "3",
      foodName: "Vegetable Curry",
      quantity: 20,
      expiryTime: new Date(Date.now() + 5400000),
      isExpired: false,
      providerId: {
        name: "City Hotel",
        location: { lat: 23.8050, lng: 90.4100 }
      }
    },
    {
      _id: "4",
      foodName: "Bananas",
      quantity: 100,
      expiryTime: new Date(Date.now() + 10800000),
      isExpired: false,
      providerId: {
        name: "Local Market",
        location: { lat: 23.8000, lng: 90.4150 }
      }
    },
    {
      _id: "5",
      foodName: "Sandwich Packs",
      quantity: 40,
      expiryTime: new Date(Date.now() + 3600000 * 4),
      isExpired: false,
      providerId: {
        name: "Food Corner",
        location: { lat: 23.8200, lng: 90.4050 }
      }
    }
  ]

  const foods = demoFoods.filter(f =>
    f.foodName.toLowerCase().includes(search.toLowerCase()) ||
    f.providerId.name.toLowerCase().includes(search.toLowerCase())
  )

  const requestFood = (id) => {
    if (requestedItems.includes(id)) return
    setRequestedItems([...requestedItems, id])
    showAlert("Success", "Demo request sent successfully!")
  }

  const providerMarkers = foods.map(f => ({
    providerKey: f._id,
    providerName: f.providerId.name,
    lat: parseDMS(f.providerId.location.lat),
    lng: parseDMS(f.providerId.location.lng),
    foods: [f]
  }))

  const positions = providerMarkers.map(m => [m.lat, m.lng])

  return (
    <div className="dashboard-page px-4">

      <div className="dashboard-header mb-8">
        <h2 className="text-4xl font-black mb-2">🍱 Find Surplus Food</h2>
        <p className="text-slate-500">
          Demo version with 5 sample food listings.
        </p>
      </div>

      {/* Search */}
      <div className="card mb-8 p-4">
        <input
          className="form-input w-full"
          placeholder="Search food or provider..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* MAP */}
        <div className="lg:w-2/3 h-[500px]">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {positions.length > 0 && <FitBounds positions={positions} />}

            {providerMarkers.map((m) => (
              <Marker key={m.providerKey} position={[m.lat, m.lng]}>
                <Popup>
                  <div>
                    <strong>{m.providerName}</strong>
                    <div>{m.foods[0].foodName}</div>
                    <div>Qty: {m.foods[0].quantity}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
{/* LIST */}
        <div className="lg:w-1/3 space-y-4">
          {foods.map(f => (
            <div key={f._id} className="card p-4 border">
              <h4 className="font-bold text-lg">{f.foodName}</h4>
              <p className="text-sm text-gray-500">
                🏪 {f.providerId.name}
              </p>
              <p className="text-sm">
                📦 {f.quantity} Servings
              </p>

              <button
                disabled={requestedItems.includes(f._id)}
                onClick={() => requestFood(f._id)}
                className={`mt-3 w-full py-2 rounded ${
                  requestedItems.includes(f._id)
                    ? 'bg-gray-300'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {requestedItems.includes(f._id)
                  ? '✓ Requested'
                  : 'Request Item'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => navigate('/foods')}
          className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl"
        >
          View More Foods
        </button>
      </div>

       {/* tanvir will add design here */}
    </div>
  )
}