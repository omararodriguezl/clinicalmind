import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { NewSessionWizard } from '../components/recording/NewSessionWizard'

export default function NewSession() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('client')

  const handleComplete = (session) => {
    navigate(`/sessions/${session.id}`, { replace: true })
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <Layout title="New Session">
      <NewSessionWizard
        preselectedClientId={clientId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </Layout>
  )
}
