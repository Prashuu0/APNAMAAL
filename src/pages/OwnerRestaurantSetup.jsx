import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { createRestaurantForOwner } from '../services/api'

export default function OwnerRestaurantSetup() {
  const { state: { user } } = useApp()
  const ownerId = user?._id || user?.id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', image: '', cuisine: '', description: '',
    deliveryTime: 30, costForTwo: 500,
    address: { street: '', city: '', state: '', pincode: '' }
  })

  if (!ownerId) {
    return <div className="max-w-2xl mx-auto p-4">Please login as Restaurant Owner.</div>
  }

  async function onSubmit() {
    try {
      setLoading(true)
      setError('')
      await createRestaurantForOwner(ownerId, form)
      navigate('/owner')
    } catch (e) {
      setError(e.message || 'Failed to create restaurant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Create Your Restaurant</h1>
      {error && <div className="p-3 mb-3 rounded bg-red-100 text-red-800">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Cuisine" value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Delivery Time (min)" value={form.deliveryTime} onChange={e => setForm({ ...form, deliveryTime: Number(e.target.value) })} />
        <input className="border p-2 rounded" type="number" placeholder="Cost for Two" value={form.costForTwo} onChange={e => setForm({ ...form, costForTwo: Number(e.target.value) })} />
        <input className="border p-2 rounded" placeholder="Street" value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
        <input className="border p-2 rounded" placeholder="City" value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
        <input className="border p-2 rounded" placeholder="State" value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
        <input className="border p-2 rounded" placeholder="Pincode" value={form.address.pincode} onChange={e => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
      </div>
      <textarea className="border p-2 rounded w-full mt-3" rows={3} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <button disabled={loading} onClick={onSubmit} className="mt-3 px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">Create Restaurant</button>
    </div>
  )
}


