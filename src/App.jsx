import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Check,
  ChevronRight,
  Clipboard,
  Clock3,
  Copy,
  DollarSign,
  Download,
  Expand,
  FileText,
  Flag,
  History,
  Lightbulb,
  Maximize2,
  Menu,
  MessageCircleMore,
  Minimize2,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { objections } from './data/objections';

const iconMap = {
  DollarSign,
  CalendarClock,
  ShieldCheck,
  UsersRound,
  MessageCircleMore,
  BrainCircuit,
};

const STORAGE_KEY = 'vibra-objection-session-v1';

const emptySession = {
  clientName: '',
  product: '',
  notes: '',
  selectedId: null,
  currentNodeId: null,
  path: [],
  lastReveal: null,
  startedAt: null,
};

function loadSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed ? { ...emptySession, ...parsed } : emptySession;
  } catch {
    return emptySession;
  }
}

function formatTime(value) {
  if (!value) return 'Agora';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function App() {
  const [session, setSession] = useState(loadSession);
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [copied, setCopied] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const appRef = useRef(null);

  const selected = useMemo(
    () => objections.find((item) => item.id === session.selectedId) ?? null,
    [session.selectedId],
  );

  const currentNode = selected && session.currentNodeId
    ? selected.nodes[session.currentNodeId]
    : null;

  const filteredObjections = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return objections;
    return objections.filter((item) =>
      `${item.label} ${item.customerPhrase} ${item.description}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setSavePulse(true);
    const timer = window.setTimeout(() => setSavePulse(false), 650);
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  function updateField(field, value) {
    setSession((prev) => ({ ...prev, [field]: value }));
  }

  function chooseObjection(item) {
    setSession((prev) => ({
      ...prev,
      selectedId: item.id,
      currentNodeId: item.start,
      path: [],
      lastReveal: null,
      startedAt: new Date().toISOString(),
    }));
    setSidebarOpen(false);
    setShowHistory(false);
  }

  function chooseOption(option) {
    if (!selected || !currentNode) return;
    const entry = {
      objectionId: selected.id,
      objectionLabel: selected.label,
      nodeId: currentNode.id,
      nodeTitle: currentNode.title,
      prompt: currentNode.prompt,
      choice: option.label,
      response: option.response,
      action: option.action,
      timestamp: new Date().toISOString(),
    };

    setSession((prev) => ({
      ...prev,
      path: [...prev.path, entry],
      currentNodeId: option.next,
      lastReveal: entry,
    }));
  }

  function goBack() {
    if (!selected || session.path.length === 0) return;
    const previousPath = session.path.slice(0, -1);
    const previous = session.path.at(-1);
    setSession((prev) => ({
      ...prev,
      path: previousPath,
      currentNodeId: previous.nodeId,
      lastReveal: previousPath.at(-1) ?? null,
    }));
  }

  function resetFlow() {
    if (!selected) return;
    setSession((prev) => ({
      ...prev,
      currentNodeId: selected.start,
      path: [],
      lastReveal: null,
      startedAt: new Date().toISOString(),
    }));
  }

  function endSession() {
    setSession((prev) => ({
      ...emptySession,
      clientName: prev.clientName,
      product: prev.product,
    }));
    setShowHistory(false);
  }

  async function copyResponse() {
    if (!session.lastReveal) return;
    const text = `${session.lastReveal.response}\n\nPróxima ação: ${session.lastReveal.action}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  function exportSummary() {
    const lines = [
      'VIBRA SOLUÇÕES — RESUMO DO ATENDIMENTO',
      '',
      `Cliente: ${session.clientName || 'Não informado'}`,
      `Produto/objetivo: ${session.product || 'Não informado'}`,
      `Objeção: ${selected?.label || 'Não selecionada'}`,
      `Início: ${session.startedAt ? new Date(session.startedAt).toLocaleString('pt-BR') : '—'}`,
      '',
      ...session.path.flatMap((entry, index) => [
        `${index + 1}. ${entry.nodeTitle}`,
        `Pergunta: ${entry.prompt}`,
        `Resposta escolhida: ${entry.choice}`,
        `Resposta sugerida: ${entry.response}`,
        `Ação: ${entry.action}`,
        '',
      ]),
      'ANOTAÇÕES',
      session.notes || 'Sem anotações.',
      '',
      'Material de apoio comercial. A comunicação deve respeitar as regras do consórcio e nunca prometer contemplação ou resultado.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `atendimento-vibra-${(session.clientName || 'cliente').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await appRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  const progress = selected
    ? Math.min(100, Math.round((session.path.length / Math.max(3, Object.keys(selected.nodes).length)) * 100))
    : 0;

  return (
    <div className="app-shell" ref={appRef}>
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
          <Menu size={21} />
        </button>
        <div className="brand-lockup">
          <img src="/vibra-logo.png" alt="Vibra Soluções" />
          <div className="brand-copy">
            <strong>Árvore de Objeções</strong>
            <span>Atendimento guiado e interativo</span>
          </div>
        </div>

        <div className="session-fields">
          <label>
            <span>Cliente</span>
            <input
              value={session.clientName}
              onChange={(event) => updateField('clientName', event.target.value)}
              placeholder="Nome do cliente"
            />
          </label>
          <label>
            <span>Objetivo / produto</span>
            <input
              value={session.product}
              onChange={(event) => updateField('product', event.target.value)}
              placeholder="Ex.: imóvel de R$ 400 mil"
            />
          </label>
        </div>

        <div className="top-actions">
          <div className={`save-status ${savePulse ? 'is-saving' : ''}`}>
            <Check size={15} />
            <span>Salvo</span>
          </div>
          <button className="icon-button" onClick={toggleFullscreen} title="Tela cheia">
            {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
          <button className="outline-button danger" onClick={endSession}>
            <X size={17} />
            <span>Encerrar</span>
          </button>
        </div>
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-mobile-head mobile-only">
          <strong>Objeções</strong>
          <button className="icon-button" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar objeção" />
        </div>

        <div className="objection-list">
          {filteredObjections.map((item) => {
            const Icon = iconMap[item.icon] ?? MessageCircleMore;
            const active = item.id === session.selectedId;
            return (
              <button
                className={`objection-item ${active ? 'active' : ''}`}
                key={item.id}
                onClick={() => chooseObjection(item)}
                style={{ '--item-color': item.color }}
              >
                <span className="objection-icon"><Icon size={19} /></span>
                <span className="objection-copy">
                  <strong>{item.label}</strong>
                  <small>{item.customerPhrase}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>

        <div className="sidebar-guide">
          <div className="guide-icon"><Lightbulb size={19} /></div>
          <div>
            <strong>Como usar</strong>
            <p>Escolha a objeção, faça a pergunta exibida e clique exatamente na resposta do cliente.</p>
          </div>
        </div>

        <div className="seller-card">
          <div className="seller-avatar">VS</div>
          <div>
            <strong>Equipe comercial</strong>
            <span>Fluxo consultivo</span>
          </div>
          <span className="online-dot" />
        </div>
      </aside>

      <main className="workspace">
        {!selected ? (
          <WelcomeScreen onSelect={chooseObjection} />
        ) : (
          <>
            <div className="workspace-toolbar">
              <div className="active-objection">
                <span className="active-dot" style={{ background: selected.color }} />
                <div>
                  <small>Objeção ativa</small>
                  <strong>{selected.label}</strong>
                </div>
                <span className="customer-phrase">{selected.customerPhrase}</span>
              </div>
              <div className="toolbar-actions">
                <button className="soft-button" onClick={goBack} disabled={session.path.length === 0}>
                  <ArrowLeft size={17} /> Voltar
                </button>
                <button className="soft-button" onClick={resetFlow}>
                  <RotateCcw size={17} /> Reiniciar
                </button>
                <button className={`soft-button ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory((value) => !value)}>
                  <History size={17} /> Histórico
                </button>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-copy">
                <span>Progresso do atendimento</span>
                <strong>{session.path.length} escolha{session.path.length === 1 ? '' : 's'}</strong>
              </div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            </div>

            <div className="content-grid">
              <section className="flow-panel">
                {showHistory ? (
                  <HistoryPanel path={session.path} onClose={() => setShowHistory(false)} />
                ) : (
                  <FlowPanel
                    selected={selected}
                    currentNode={currentNode}
                    path={session.path}
                    lastReveal={session.lastReveal}
                    onChoose={chooseOption}
                    onRestart={resetFlow}
                  />
                )}
              </section>

              <aside className="coach-panel">
                <div className="coach-section response-section">
                  <div className="section-heading">
                    <span className="section-icon"><Sparkles size={17} /></span>
                    <div>
                      <small>Assistente comercial</small>
                      <strong>Resposta sugerida</strong>
                    </div>
                  </div>
                  {session.lastReveal ? (
                    <>
                      <blockquote>“{session.lastReveal.response}”</blockquote>
                      <button className="copy-button" onClick={copyResponse}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copiado' : 'Copiar resposta'}
                      </button>
                    </>
                  ) : (
                    <div className="empty-coach">
                      <MessageCircleMore size={27} />
                      <p>A resposta sugerida aparece depois que você clicar na resposta do cliente.</p>
                    </div>
                  )}
                </div>

                <div className="coach-section action-section">
                  <div className="section-heading">
                    <span className="section-icon green"><Flag size={17} /></span>
                    <div>
                      <small>Condução</small>
                      <strong>Próxima ação</strong>
                    </div>
                  </div>
                  <p>{session.lastReveal?.action ?? 'Faça a pergunta central e ouça a resposta completa antes de clicar.'}</p>
                </div>

                <div className="coach-section tips-section">
                  <div className="section-heading">
                    <span className="section-icon cyan"><Lightbulb size={17} /></span>
                    <div>
                      <small>Boas práticas</small>
                      <strong>Durante a conversa</strong>
                    </div>
                  </div>
                  <ul>
                    <li><Check size={15} /> Não interrompa o cliente.</li>
                    <li><Check size={15} /> Confirme o verdadeiro motivo.</li>
                    <li><Check size={15} /> Não prometa contemplação.</li>
                    <li><Check size={15} /> Defina sempre o próximo compromisso.</li>
                  </ul>
                </div>

                <div className="coach-section notes-section">
                  <div className="section-heading">
                    <span className="section-icon navy"><FileText size={17} /></span>
                    <div>
                      <small>Registro</small>
                      <strong>Anotações</strong>
                    </div>
                  </div>
                  <textarea
                    value={session.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    placeholder="Anote contexto, prioridade e próximo compromisso..."
                  />
                  <button className="export-button" onClick={exportSummary} disabled={!selected}>
                    <Download size={16} /> Exportar resumo
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      {sidebarOpen && <button className="mobile-overlay mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}
    </div>
  );
}

function WelcomeScreen({ onSelect }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-badge"><Sparkles size={16} /> Método Vibra</div>
      <h1>Conduza objeções com clareza,<br />um clique de cada vez.</h1>
      <p>O conteúdo aparece somente depois da escolha. Assim, o vendedor acompanha a conversa sem antecipar respostas ou se perder no roteiro.</p>
      <div className="welcome-steps">
        <div><span>1</span><strong>Ouça</strong><small>Identifique a objeção real.</small></div>
        <ArrowRight size={21} />
        <div><span>2</span><strong>Clique</strong><small>Selecione a resposta recebida.</small></div>
        <ArrowRight size={21} />
        <div><span>3</span><strong>Conduza</strong><small>Use a fala e o próximo gatilho.</small></div>
      </div>
      <div className="welcome-options">
        {objections.slice(0, 5).map((item) => {
          const Icon = iconMap[item.icon] ?? MessageCircleMore;
          return (
            <button key={item.id} onClick={() => onSelect(item)} style={{ '--item-color': item.color }}>
              <span><Icon size={21} /></span>
              <div><strong>{item.label}</strong><small>{item.customerPhrase}</small></div>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FlowPanel({ selected, currentNode, path, lastReveal, onChoose, onRestart }) {
  return (
    <div className="flow-canvas">
      <div className="flow-path-strip">
        <div className="lead-node">
          <span><UserRound size={18} /></span>
          <div><small>Lead</small><strong>Cliente</strong></div>
        </div>
        <ArrowRight size={18} />
        <div className="objection-node" style={{ '--node-color': selected.color }}>
          <span>{selected.label.slice(0, 1)}</span>
          <div><small>Objeção</small><strong>{selected.label}</strong></div>
        </div>
        {path.map((entry, index) => (
          <div className="path-fragment" key={`${entry.nodeId}-${index}`}>
            <ArrowRight size={18} />
            <div className="history-node"><small>{entry.nodeTitle}</small><strong>{entry.choice}</strong></div>
          </div>
        ))}
      </div>

      {currentNode ? (
        <div className="question-stage" key={currentNode.id}>
          <div className="step-label"><span>{path.length + 1}</span> Gatilho atual</div>
          <div className="question-card">
            <div className="question-icon"><MessageCircleMore size={25} /></div>
            <div>
              <small>{currentNode.title}</small>
              <h2>{currentNode.prompt}</h2>
              <p>Clique na opção que mais se aproxima da resposta do cliente.</p>
            </div>
          </div>

          <div className="option-branches">
            {currentNode.options.map((option, index) => (
              <button className={`answer-option ${option.tone}`} key={option.label} onClick={() => onChoose(option)}>
                <span className="answer-index">{String.fromCharCode(65 + index)}</span>
                <span className="answer-copy"><strong>{option.label}</strong><small>Mostrar resposta sugerida e próximo passo</small></span>
                <ChevronRight size={20} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="completed-stage">
          <div className="completed-icon"><Check size={34} /></div>
          <span>Fluxo concluído</span>
          <h2>O próximo compromisso está definido?</h2>
          <p>{lastReveal?.action ?? 'Registre a decisão e finalize o atendimento.'}</p>
          <div className="completion-actions">
            <button className="primary-button" onClick={onRestart}><RotateCcw size={17} /> Refazer fluxo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ path, onClose }) {
  return (
    <div className="history-panel">
      <div className="history-head">
        <div><small>Caminho percorrido</small><h2>Histórico do atendimento</h2></div>
        <button className="icon-button" onClick={onClose}><X size={19} /></button>
      </div>
      {path.length === 0 ? (
        <div className="history-empty"><Clock3 size={28} /><p>Nenhuma escolha foi feita neste fluxo.</p></div>
      ) : (
        <div className="timeline">
          {path.map((entry, index) => (
            <article key={`${entry.nodeId}-${index}`}>
              <div className="timeline-marker"><span>{index + 1}</span></div>
              <div className="timeline-card">
                <div className="timeline-meta"><strong>{entry.nodeTitle}</strong><time>{formatTime(entry.timestamp)}</time></div>
                <p className="timeline-question">{entry.prompt}</p>
                <div className="timeline-choice">Resposta: <strong>{entry.choice}</strong></div>
                <blockquote>“{entry.response}”</blockquote>
                <div className="timeline-action"><Flag size={15} /> {entry.action}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
