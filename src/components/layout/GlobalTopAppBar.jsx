import TopAppBar from './TopAppBar'
import { usePageHeaderContext } from '../../contexts/PageHeaderContext'

function GlobalTopAppBar() {
  const { header } = usePageHeaderContext()
  if (!header) return null
  return <TopAppBar {...header} />
}

export default GlobalTopAppBar