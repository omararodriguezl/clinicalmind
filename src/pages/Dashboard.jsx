import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Mic, ShieldAlert, ClipboardList,
  TrendingUp, AlertTriangle, Plus, ArrowRight,
  Shield, Stethoscope
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { getClients, getSessions } from '../utils/supabase'

function StatCard({ label, value, icon: Icon, color, to }) {
  const content = (
    <div className={`card p-4 flex items-center gap-4 hover:border-border-light transition-colors ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary">{label}</div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function QuickAction({ to, icon: Icon, label, description, mode }) {
  const modeStyles = {
    army: 'border-army-border bg-army-bg hover:border-army text-army-text',
    civilian: 'border-civilian-border bg-civilian-bg hover:border-civilian text-civilian-text',
    default: 'border-border bg-surface hover:border-border-light text-text-primary',
  }
  return (
    <Link
      to={to}
      className={`block p-4 rounded-lg border transition-all duration-150 group ${modeStyles[mode || 'default']}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold mb-0.5">{label}</div>
          <div className="text-xs opacity-70">{description}</div>
        </div>
        <ArrowRight className="w-4 h-4 ml-auto mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ clients: 0, sessions: 0, safetyPlans: 0, recentSessions: [] })
  const [loading, setLoading] = useState(true)

  const firstName = user?.email?.split('@')[0] || 'Clinician'

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [clients, sessions] = await Promise.all([
          getClients(user.id),
          getSessions(user.id),
        ])
        setStats({
          clients: clients.length,
          sessions: sessions.length,
          safetyPlans: clients.filter(c => c.has_active_safety_plan).length,
          recentSessions: sessions.slice(0, 5),
          alertClients: clients.filter(c => c.has_active_safety_plan),
        })
      } catch (_) {}
      finally { setLoading(false) }
    }
    load()
  }, [user])

  return (
    <Layout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Welcome back, <span className="text-gradient-blue">{firstName}</span>
        </h2>
        <p className="text-sm text-text-secondary mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert banner for active safety plans */}
      {stats.alertClients?.length > 0 && (
        <div className="mb-5 p-3 rounded-lg bg-danger-muted border border-red-700 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0 animate-pulse-slow" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Active Safety Plans</p>
            <p className="text-xs text-red-400 mt-0.5">
              {stats.alertClients.length} client{stats.alertClients.length > 1 ? 's have' : ' has'} an active safety plan: {' '}
              {stats.alertClients.map(c => c.client_id_number).join(', ')}
            </p>
          </div>
          <Link to="/safety">
            <Button variant="danger" size="xs">Review</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Clients" value={stats.clients} icon={Users} color="bg-primary/10 text-primary" to="/clients" />
        <StatCard label="Total Sessions" value={stats.sessions} icon={Mic} color="bg-purple-900/40 text-purple-400" to="/sessions" />
        <StatCard label="Active Safety Plans" value={stats.safetyPlans} icon={ShieldAlert} color={stats.safetyPlans > 0 ? "bg-danger-muted text-danger" : "bg-surface-3 text-text-muted"} to="/safety" />
        <StatCard label="This Month" value={stats.recentSessions?.filter(s => new Date(s.session_date) > new Date(Date.now() - 30 * 86400000)).length || 0} icon={TrendingUp} color="bg-success-muted text-success" />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            to="/sessions"
            icon={Shield}
            label="New Army Session"
            description="68X military SOAP note with combat stress indicators"
            mode="army"
          />
          <QuickAction
            to="/sessions"
            icon={Stethoscope}
            label="New Civilian Session"
            description="Standard behavioral health SOAP note"
            mode="civilian"
          />
          <QuickAction
            to="/clients"
            icon={Plus}
            label="Add Client"
            description="Register a new client profile"
            mode="default"
          />
          <QuickAction
            to="/safety"
            icon={ShieldAlert}
            label="Safety Plan"
            description="Build or review a client safety plan"
            mode="default"
          />
          <QuickAction
            to="/staffing"
            icon={ClipboardList}
            label="Staffing Document"
            description="Generate a supervisor staffing report"
            mode="default"
          />
          <QuickAction
            to="/dsm"
            icon={Users}
            label="DSM-5 Reference"
            description="Look up diagnostic criteria & ICD-10 codes"
            mode="default"
          />
        </div>
      </div>

      {/* Recent Sessions */}
      {stats.recentSessions?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent Sessions</h3>
            <Link to="/sessions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {stats.recentSessions.map((session) => (
              <Link key={session.id} to={`/sessions/${session.id}`}>
                <div className="card p-3 flex items-center gap-3 hover:border-border-light transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.mode === 'army' ? 'bg-army' : 'bg-civilian'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary font-medium truncate">
                      {session.clients?.client_id_number || 'Unknown'}
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(session.session_date).toLocaleDateString()}
                      {' · '}
                      {session.mode === 'army' ? '68X Army' : 'Civilian RBT'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
