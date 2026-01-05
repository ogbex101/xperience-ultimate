import React, { useState, useEffect } from 'react'
import { 
  X, Shield, Users, AlertCircle, CheckCircle, 
  DollarSign, Loader, ChevronRight
} from 'lucide-react'

const SquadRegistrationModal = ({ 
  tournament, 
  userGroups, 
  userXP, 
  onClose, 
  onJoin, 
  onValidate 
}) => {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [squadName, setSquadName] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [validating, setValidating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  
  const selectedGroupData = userGroups.find(g => g.id == selectedGroup)

  useEffect(() => {
    if (selectedGroup) {
      handleValidateGroup()
    } else {
      setValidationResult(null)
    }
  }, [selectedGroup])

  const handleValidateGroup = async () => {
    if (!selectedGroup) return
    
    setValidating(true)
    setError('')
    
    try {
      const result = await onValidate(selectedGroup)
      setValidationResult(result)
    } catch (error) {
      setError('Failed to validate group')
      console.error('Validation error:', error)
    } finally {
      setValidating(false)
    }
  }

  const handleRegister = async () => {
    if (!selectedGroup || !validationResult?.eligible) {
      setError('Please select a valid group')
      return
    }

    if (tournament.xp_entry_fee > userXP) {
      setError(`Insufficient XP balance. You need ${tournament.xp_entry_fee} XP, you have ${userXP} XP`)
      return
    }

    setJoining(true)
    setError('')

    try {
      await onJoin({
        group_id: parseInt(selectedGroup),
        squad_name: squadName.trim() || null
      })
    } catch (error) {
      setError(error.message || 'Failed to register squad')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Register Squad</h2>
              <p className="text-sm text-gray-400">{tournament.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* XP Balance */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">Your XP Balance</div>
                <div className="text-xl font-bold text-green-400">{userXP.toLocaleString()} XP</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Entry Fee</div>
                <div className={`text-xl font-bold ${tournament.xp_entry_fee > 0 ? 'text-white' : 'text-green-400'}`}>
                  {tournament.xp_entry_fee > 0 
                    ? `${tournament.xp_entry_fee.toLocaleString()} XP`
                    : 'Free'
                  }
                </div>
              </div>
            </div>
            {tournament.xp_entry_fee > userXP && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Insufficient XP balance</span>
                </div>
              </div>
            )}
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Your Group *
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input-primary w-full"
              disabled={joining}
            >
              <option value="">Choose a group...</option>
              {userGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.member_count}/5 members)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Group Info */}
          {selectedGroupData && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-2">{selectedGroupData.name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Game Specialty:</span>
                  <span className="text-white">{selectedGroupData.game_specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Members:</span>
                  <span className={`${
                    selectedGroupData.member_count >= 1 && selectedGroupData.member_count <= 5
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {selectedGroupData.member_count} / 5
                  </span>
                </div>
                {selectedGroupData.description && (
                  <div>
                    <span className="text-gray-400">Description:</span>
                    <p className="text-gray-300 mt-1">{selectedGroupData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Result */}
          {validating && (
            <div className="flex items-center justify-center p-4">
              <Loader className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="ml-3 text-gray-300">Validating group...</span>
            </div>
          )}

          {validationResult && !validating && (
            <div className={`rounded-lg p-4 border ${
              validationResult.eligible
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start space-x-3">
                {validationResult.eligible ? (
                  <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    validationResult.eligible ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validationResult.eligible ? 'Group is Eligible' : 'Group Cannot Join'}
                  </h4>
                  
                  {validationResult.message && (
                    <p className="text-sm mt-1">{validationResult.message}</p>
                  )}

                  {validationResult.conflicts && validationResult.conflicts.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-300 mb-1">Conflicts:</h5>
                      <ul className="space-y-1">
                        {validationResult.conflicts.map(conflict => (
                          <li key={conflict.user_id} className="text-sm text-gray-400 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-1" />
                            {conflict.username} is already in {conflict.existing_group}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.max_squads_reached && (
                    <p className="text-sm mt-2">
                      Tournament is full ({validationResult.current_squads}/{validationResult.max_squads_allowed} squads)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Squad Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Squad Name (Optional)
            </label>
            <input
              type="text"
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              className="input-primary w-full"
              placeholder="e.g., Alpha Warriors, Team Phoenix"
              maxLength="50"
              disabled={joining || !validationResult?.eligible}
            />
            <p className="text-xs text-gray-400 mt-1">
              Custom name for your squad in this tournament
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={joining}
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={
                joining || 
                !selectedGroup || 
                !validationResult?.eligible || 
                tournament.xp_entry_fee > userXP
              }
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2 inline" />
                  Registering...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2 inline" />
                  Register Squad
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/50 rounded-b-xl">
          <div className="text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>All group members will automatically join the tournament</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <DollarSign className="w-4 h-4" />
              <span>XP entry fee will be deducted from your account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SquadRegistrationModal