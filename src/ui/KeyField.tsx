interface Props {
  value: string
  onChange: (valor: string) => void
}

export function KeyField({ value, onChange }: Props) {
  return (
    <div className="campo">
      <label htmlFor="chave-api">Chave da API Claude (opcional)</label>
      <input
        id="chave-api"
        type="password"
        autoComplete="new-password"
        placeholder="sk-ant-..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <small>
        Sem chave, o app usa a IA local (Claude Code instalado neste computador, quando o app roda com npm run dev) ou, se ela não
        existir, o modo demo com exemplos prontos. A chave fica só na memória desta aba: não é salva nem enviada a nenhum servidor
        além da API da Anthropic.
      </small>
    </div>
  )
}
