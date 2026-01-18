import { ArrowLeft, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export function SubAgentListPage({
  subAgents,
  onSelectSubAgent,
  onAddSubAgent,
}) {
  const [view, setView] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    contact: '',
    status: 'active',
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const success = await onAddSubAgent(formData)
    if (success) {
      setFormData({ name: '', country: '', contact: '', status: 'active' })
      setView('list')
    }
    setIsSubmitting(false)
  }

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success'
      case 'pending': return 'warning'
      case 'inactive': return 'default'
      default: return 'default'
    }
  }

  const filteredAgents = subAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (view === 'add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Sub Agent</h1>
            <p className="text-gray-600 mt-1">Register a new recruitment partner</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Sub Agent Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
              <Input label="Country" value={formData.country} onChange={(e) => handleChange('country', e.target.value)} required />
              <Input label="Contact Number" value={formData.contact} onChange={(e) => handleChange('contact', e.target.value)} required />
              <Select
                label="Status"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              />
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Sub Agent'}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setView('list')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sub Agents</h1>
          <p className="text-gray-600 mt-1">Manage recruitment partners and their performance</p>
        </div>
        <Button
  onClick={() => onNavigate('add-sub-agent')}
  className="flex items-center justify-center h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-200 transition-all hover:brightness-110 active:scale-95 whitespace-nowrap"
>
  <Plus size={18} className="mr-2 stroke-[3px]" />
  <span>Add Sub Agent</span>
</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Partner Directory ({filteredAgents.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>

                <TableHead>Contact</TableHead>
                <TableHead>Total Workers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent._id} className="cursor-pointer hover:bg-gray-50/50" onClick={() => onSelectSubAgent(agent._id)}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.country}</TableCell>
                  <TableCell className="font-mono text-sm">{agent.contact}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{agent.totalWorkersBrought || 0}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(agent.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

