import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, User, Users, AlertCircle, Heart, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react'

// Dummy data for family to show off the UI immediately
const INITIAL_FAMILY = [
  { id: 1, name: 'Aryan Jaiswal', relation: 'Self', age: 29, status: 'covered' },
  { id: 2, name: 'Priya Jaiswal', relation: 'Spouse', age: 27, status: 'covered' },
  { id: 3, name: 'Ramesh Jaiswal', relation: 'Father', age: 62, status: 'uncovered' },
  { id: 4, name: 'Sunita Jaiswal', relation: 'Mother', age: 58, status: 'uncovered' }
]

export default function FamilyManager() {
  const navigate = useNavigate()
  const [members, setMembers] = useState(INITIAL_FAMILY)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', relation: '', age: '' })

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!newMember.name || !newMember.relation || !newMember.age) return
    
    setMembers([
      ...members, 
      { 
        id: Date.now(), 
        ...newMember, 
        age: parseInt(newMember.age),
        status: parseInt(newMember.age) > 50 ? 'uncovered' : 'warning' 
      }
    ])
    setShowAddModal(false)
    setNewMember({ name: '', relation: '', age: '' })
  }

  const uncoveredParents = members.filter(m => (m.relation === 'Father' || m.relation === 'Mother') && m.status === 'uncovered')
  const uncoveredKids = members.filter(m => m.relation === 'Child' && m.status !== 'covered')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* ── Header ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-gray-900 font-bold text-lg leading-tight">Family & Dependents</h1>
            <p className="text-gray-500 text-xs font-medium">Manage protection for your loved ones</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#0B1F4B] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-900 transition shadow-sm"
        >
          <Plus size={20} />
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">

        {/* AI Analysis Engine Header */}
        {(uncoveredParents.length > 0 || uncoveredKids.length > 0) && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-6 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-600">
              <ShieldAlert size={100} />
            </div>
            
            <div className="flex items-center gap-2 text-orange-600 mb-3 relative z-10">
              <Sparkles size={20} />
              <h2 className="font-bold font-outfit text-lg">AI Coverage Analysis</h2>
            </div>
            
            <div className="space-y-3 relative z-10">
              {uncoveredParents.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200/50 flex gap-4 items-start shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-1">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Senior Coverage Gap Detected</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      Your parents (<span className="font-semibold">{uncoveredParents.map(p => p.name).join(' & ')}</span>) are currently uninsured. Medical inflation for seniors is 14%. 
                    </p>
                    <button onClick={() => navigate('/compare?category=health')} className="mt-3 text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
                      View Senior Citizen Plans &rarr;
                    </button>
                  </div>
                </div>
              )}

              {uncoveredKids.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200/50 flex gap-4 items-start shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Child Dependents Vulnerable</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      You've added children to your profile but haven't expanded your base Health or Term covers to account for them.
                    </p>
                    <button onClick={() => navigate('/chat?context=child_addition_advice')} className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      Ask AI for Advice &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <h2 className="text-gray-800 font-bold text-lg pt-2 px-1">Registered Members</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 
                ${member.status === 'covered' ? 'bg-green-50 border-green-100 text-green-600' : 
                  member.status === 'warning' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 
                  'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                <User size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{member.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{member.relation} • {member.age} yrs</p>
                  </div>
                  
                  {member.status === 'covered' && <CheckCircle size={18} className="text-green-500" />}
                  {member.status === 'warning' && <AlertCircle size={18} className="text-yellow-500" />}
                  {member.status === 'uncovered' && <AlertCircle size={18} className="text-red-500" />}
                </div>
                
                <div className="mt-3 flex items-center">
                  {member.status === 'covered' ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-1 rounded inline-block">Safeguarded</span>
                  ) : member.status === 'warning' ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-block">Partial Cover</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-1 rounded inline-block">At Risk</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Button Card */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 hover:border-gray-300 transition group flex flex-col items-center justify-center gap-2 min-h-[120px]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-sm font-bold text-gray-600">Add Dependent</span>
          </button>
        </div>

      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            <div className="bg-[#0B1F4B] p-6 text-white text-center relative">
              <h2 className="text-xl font-bold">Add Family Member</h2>
              <p className="text-blue-200 text-sm mt-1">Our AI will analyze their risk profile</p>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="e.g. Priya Sharma" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship</label>
                  <select 
                    required
                    value={newMember.relation}
                    onChange={e => setNewMember({...newMember, relation: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Age</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={newMember.age}
                    onChange={e => setNewMember({...newMember, age: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    placeholder="e.g. 29" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 btn-gradient text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
