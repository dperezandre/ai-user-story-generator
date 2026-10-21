import { useState } from 'react'
import { DocumentMode } from './ui/DocumentMode'
import { KeyField } from './ui/KeyField'
import { ShortMode } from './ui/ShortMode'
import { useClient } from './ui/useClient'
import './index.css'

type Aba = 'documento' | 'curta'

export default function App({ sondarIaLocal }: { sondarIaLocal?: () => Promise<boolean> }) {
  const [apiKey, setApiKey] = useState('')
  const [aba, setAba] = useState<Aba>('documento')
  const { client, demo, modo } = useClient(apiKey, sondarIaLocal)
  const usarDemo = () => setApiKey('')

  return (
    <main>
      <header>
        <h1>Gerador de Histórias de Usuário com IA</h1>
        <p>
          Transforme uma necessidade ou um documento de requisitos em histórias de usuário com critérios de aceite, avaliação INVEST e
          perguntas de refinamento.
          {demo && <span className="selo"> Modo demo</span>}
          {modo === 'local' && <span className="selo local"> IA local</span>}
        </p>
      </header>

      <p className="aviso">⚠ Não cole dados sensíveis, de pacientes ou confidenciais da sua empresa neste app.</p>
      <KeyField value={apiKey} onChange={setApiKey} />

      <div role="tablist" className="abas">
        <button role="tab" type="button" aria-selected={aba === 'documento'} onClick={() => setAba('documento')}>
          Documento de requisitos
        </button>
        <button role="tab" type="button" aria-selected={aba === 'curta'} onClick={() => setAba('curta')}>
          História curta
        </button>
      </div>

      {/* Os dois modos ficam montados; ocultar preserva texto, resultado e edições ao trocar de aba ou de modo. */}
      <div hidden={aba !== 'documento'}>
        <DocumentMode client={client} demo={demo} onUseDemo={usarDemo} />
      </div>
      <div hidden={aba !== 'curta'}>
        <ShortMode client={client} demo={demo} onUseDemo={usarDemo} />
      </div>
    </main>
  )
}
