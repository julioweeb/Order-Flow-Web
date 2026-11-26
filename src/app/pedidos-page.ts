import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoApiService } from './pedido-api.service';
import { Pedido, PedidoEvento, StatusPedido } from './pedido.model';

type Filtro = 'todos' | StatusPedido;

type Cenario = 'aprova' | 'recusa' | 'instavel' | 'falha';

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Fernanda', 'Gustavo', 'Helena', 'Igor',
               'Juliana', 'Lucas', 'Marina', 'Rafael', 'Sofia', 'Thiago', 'Vanessa'];
const SOBRENOMES = ['Almeida', 'Barros', 'Costa', 'Dias', 'Ferreira', 'Gomes', 'Lima', 'Martins',
                    'Nunes', 'Oliveira', 'Pereira', 'Ribeiro', 'Santos', 'Silva', 'Souza'];

const sortear = <T>(lista: T[]): T => lista[Math.floor(Math.random() * lista.length)];

// Sorteia um valor de loja: múltiplo de 10 menos 10 centavos (ex.: 149,90)
function valorAleatorio(min: number, max: number): number {
  const base = Math.round((min + Math.random() * (max - min)) / 10) * 10;
  return +(base - 0.1).toFixed(2);
}

@Component({
  selector: 'app-pedidos-page',
  imports: [FormsModule],
  template: `
    <main>
      <section class="resumo">
        <button
          type="button"
          class="stat"
          [class.ativo]="filtro() === 'todos'"
          (click)="filtrar('todos')"
          data-tip="Todos os pedidos criados. Os quatro cards são filtros: clique para filtrar a lista."
          data-tip-pos="inicio"
        >
          <span class="stat-valor">{{ total() }}</span>
          <span class="stat-rotulo">Pedidos</span>
        </button>
        <button
          type="button"
          class="stat pendente"
          [class.ativo]="filtro() === 'Pendente'"
          (click)="filtrar('Pendente')"
          data-tip="A mensagem ainda está na fila ou o worker está processando o pagamento (inclui as tentativas de retry)."
        >
          <span class="stat-valor">{{ pendentes() }}</span>
          <span class="stat-rotulo">Processando</span>
        </button>
        <button
          type="button"
          class="stat aprovado"
          [class.ativo]="filtro() === 'PagamentoAprovado'"
          (click)="filtrar('PagamentoAprovado')"
          data-tip="O worker aprovou o pagamento e a API já atualizou o pedido no banco."
        >
          <span class="stat-valor">{{ aprovados() }}</span>
          <span class="stat-rotulo">Aprovados</span>
        </button>
        <button
          type="button"
          class="stat recusado"
          [class.ativo]="filtro() === 'PagamentoRecusado'"
          (click)="filtrar('PagamentoRecusado')"
          data-tip="O worker recusou o pagamento (no demo, valores acima de R$ 5.000)."
          data-tip-pos="fim"
        >
          <span class="stat-valor">{{ recusados() }}</span>
          <span class="stat-rotulo">Recusados</span>
        </button>
      </section>

      <section class="painel">
        <h2>Novo pedido</h2>
        <form class="formulario" (ngSubmit)="criar()">
          <input name="cliente" placeholder="Nome do cliente" [(ngModel)]="cliente" required />
          <input
            name="valor"
            type="number"
            min="1"
            step="0.01"
            placeholder="Valor (R$)"
            [(ngModel)]="valor"
            required
          />
          <button
            type="submit"
            class="botao"
            [disabled]="enviando()"
            data-tip="Envia POST /pedidos. A API responde na hora e o pagamento é processado em segundo plano."
            data-tip-pos="fim"
          >
            {{ enviando() ? 'Enviando...' : 'Criar pedido' }}
          </button>
        </form>

          <div class="atalhos">
          <span>Teste rápido:</span>
          <button
            type="button"
            class="atalho"
            (click)="preencher('aprova')"
            data-tip="Gera um cliente aleatório com valor até R$ 5.000: o worker aprova o pagamento."
            data-tip-pos="inicio"
          >
            Pedido aprovado
          </button>
          <button
            type="button"
            class="atalho"
            (click)="preencher('recusa')"
            data-tip="Gera um cliente aleatório com valor acima de R$ 5.000: o worker recusa o pagamento."
          >
            Pedido recusado
          </button>
          <button
            type="button"
            class="atalho"
            (click)="preencher('instavel')"
            data-tip="O nome ganha a marca [instavel]: o gateway falha 2 vezes e funciona na 3ª. Abra a linha do tempo para ver o retry."
          >
            Gateway instável (retry)
          </button>
          <button
            type="button"
            class="atalho"
            (click)="preencher('falha')"
            data-tip="O nome ganha a marca [falha]: o gateway nunca funciona. Depois de 4 tentativas a mensagem vai para a Dead Letter Queue."
            data-tip-pos="fim"
          >
            Gateway fora (DLQ)
          </button>
        </div>

        @if (erro()) {
          <p class="erro">{{ erro() }}</p>
        }
      </section>

      <section class="painel">
        <div class="cabecalho">
          <h2>Pedidos recentes</h2>
          <span
            class="ao-vivo"
            [class.ligado]="acompanhando()"
            data-tip="Enquanto houver pedido processando ou uma linha do tempo aberta, a tela consulta a API a cada 2 segundos. Sem nada em andamento, ela para."
            data-tip-pos="fim"
          >
            <span class="ponto"></span>
            {{ acompanhando() ? 'Acompanhando ao vivo' : 'Em repouso' }}
          </span>
        </div>
        <p class="dica">Clique em um pedido para ver a linha do tempo do que aconteceu com ele.</p>

        @if (pedidos().length === 0) {
          <p class="vazio">Nenhum pedido ainda. Crie o primeiro acima.</p>
        } @else if (visiveis().length === 0) {
          <p class="vazio">Nenhum pedido neste filtro.</p>
        }

        @for (p of visiveis(); track p.id) {
          <article class="pedido">
            <div
              class="pedido-topo"
              role="button"
              tabindex="0"
              (click)="alternar(p.id)"
              (keydown.enter)="alternar(p.id)"
            >
              <div class="pedido-info">
                <strong>{{ p.cliente }}</strong>
                <span class="meta">
                  {{ moeda(p.valor) }} · {{ hora(p.criadoEmUtc) }} ·
                  <span
                    class="id"
                    data-tip="Identificador único do pedido (8 primeiros caracteres). Ele viaja dentro de todas as mensagens."
                    >#{{ p.id.slice(0, 8) }}</span
                  >
                </span>
                @if (p.motivoRecusa) {
                  <span class="motivo">{{ p.motivoRecusa }}</span>
                }
              </div>
              <div class="direita">
                <span [class]="classe(p.status)" [attr.data-tip]="dicaStatus(p.status)" data-tip-pos="fim">
                  <span class="ponto"></span>
                  {{ rotulo(p.status) }}
                </span>
                <span class="seta">{{ abertoId() === p.id ? '▲' : '▼' }}</span>
              </div>
            </div>

            @if (abertoId() === p.id) {
              <ol class="timeline">
                @for (e of eventos(); track e.id) {
                  <li>
                    <span class="tempo" data-tip="Tempo desde o primeiro evento deste pedido." data-tip-pos="inicio">{{
                      deslocamento(e)
                    }}</span>
                    <span [class]="classeOrigem(e.origem)" [attr.data-tip]="dicaOrigem(e.origem)">{{ e.origem }}</span>
                    <span class="texto">{{ e.mensagem }}</span>
                  </li>
                }
                @if (eventos().length === 0) {
                  <li class="vazio">Nenhum evento registrado para este pedido.</li>
                }
              </ol>
            }
          </article>
        }
      </section>
    </main>
  `,
  
    styles: `
    :host { display: block; }
    main { max-width: 760px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }

    .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
    .stat { background: var(--card); border: 1px solid var(--borda); border-radius: 12px; padding: 0.9rem;
            text-align: center; font: inherit; color: inherit; cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s; }
    .stat:hover { transform: translateY(-2px); border-color: #3a4d6e; }
    .stat.ativo { border-color: var(--primaria); box-shadow: 0 0 0 3px var(--foco); }
    .stat-valor { display: block; font-size: 1.7rem; font-weight: 700; }
    .stat-rotulo { font-size: 0.78rem; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.04em; }
    .stat.pendente .stat-valor { color: var(--pend-txt); }
    .stat.aprovado .stat-valor { color: var(--apr-txt); }
    .stat.recusado .stat-valor { color: var(--rec-txt); }

    .painel { background: var(--card); border: 1px solid var(--borda); border-radius: 14px;
              padding: 1.1rem; margin-bottom: 1.25rem; }
    h2 { margin: 0 0 0.8rem; font-size: 1.05rem; }
    .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .dica { margin: -0.4rem 0 0.6rem; font-size: 0.82rem; color: var(--texto-suave); }

    .ao-vivo { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600;
               color: var(--texto-suave); background: var(--card-suave); padding: 0.25rem 0.65rem;
               border-radius: 999px; cursor: help; }
    .ao-vivo.ligado { color: var(--apr-txt); background: var(--apr-bg); }
    .ao-vivo.ligado .ponto { animation: pulsar 1.1s infinite; }

    .formulario { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    input { flex: 1; min-width: 140px; padding: 0.65rem 0.75rem; border: 1px solid var(--borda);
            border-radius: 8px; font-size: 0.95rem; background: var(--campo); color: var(--texto); }
    input::placeholder { color: #64748b; }
    input:focus { outline: 2px solid var(--foco); border-color: var(--primaria); }
    .botao { padding: 0.65rem 1.2rem; border: 0; border-radius: 8px; background: var(--primaria-forte);
             color: #fff; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .botao:hover:not(:disabled) { background: var(--primaria); }
    .botao:disabled { opacity: 0.6; cursor: not-allowed; }

    .atalhos { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.7rem;
               font-size: 0.85rem; color: var(--texto-suave); flex-wrap: wrap; }
    .atalho { border: 1px dashed #475569; background: transparent; color: var(--texto-corpo);
              border-radius: 999px; padding: 0.25rem 0.75rem; cursor: pointer; font-size: 0.8rem;
              transition: background 0.2s, border-color 0.2s; }
    .atalho:hover { background: var(--card-suave); border-color: var(--primaria); }

    .erro { color: var(--rec-txt); margin: 0.8rem 0 0; font-size: 0.9rem; }
    .vazio { color: var(--texto-suave); margin: 0; }

    .pedido { border-top: 1px solid var(--borda); animation: entrar 0.35s ease; }
    .pedido:first-of-type { border-top: 0; }
    .pedido-topo { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
                   padding: 0.8rem 0.4rem; cursor: pointer; border-radius: 8px; }
    .pedido-topo:hover { background: var(--card-suave); }
    .pedido-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .meta { color: var(--texto-suave); font-size: 0.85rem; }
    .id { cursor: help; border-bottom: 1px dotted #64748b; }
    .motivo { color: var(--rec-txt); font-size: 0.8rem; }
    .direita { display: flex; align-items: center; gap: 0.6rem; }
    .seta { color: var(--texto-suave); font-size: 0.7rem; }

    .timeline { list-style: none; margin: 0 0 0.8rem 0.9rem; padding: 0 0 0 1rem;
                border-left: 2px solid var(--borda); display: flex; flex-direction: column; gap: 0.55rem; }
    .timeline li { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.85rem; flex-wrap: wrap; }
    .tempo { font-variant-numeric: tabular-nums; color: var(--texto-suave); min-width: 3.6rem; cursor: help; }
    .origem { padding: 0.1rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 600;
              white-space: nowrap; cursor: help; }
    .origem.api { background: var(--api-bg); color: var(--api-txt); }
    .origem.worker { background: var(--worker-bg); color: var(--worker-txt); }
    .texto { flex: 1; min-width: 180px; color: var(--texto-corpo); }

    .badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.8rem;
             border-radius: 999px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;
             transition: background 0.4s, color 0.4s; cursor: help; }
    .ponto { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .badge.pendente { background: var(--pend-bg); color: var(--pend-txt); }
    .badge.pendente .ponto { animation: pulsar 1.1s infinite; }
    .badge.aprovado { background: var(--apr-bg); color: var(--apr-txt); }
    .badge.recusado { background: var(--rec-bg); color: var(--rec-txt); }

    @keyframes pulsar { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.4); } }
    @keyframes entrar { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    @media (max-width: 560px) { .resumo { grid-template-columns: repeat(2, 1fr); } }
  `

})
export class PedidosPage implements OnInit {
  private api = inject(PedidoApiService);
  private destroyRef = inject(DestroyRef);
  private temporizador?: ReturnType<typeof setTimeout>;

  pedidos = signal<Pedido[]>([]);
  erro = signal<string | null>(null);
  enviando = signal(false);

  // true enquanto a tela está consultando a API periodicamente
  acompanhando = signal(false);

  // Pedido com a linha do tempo aberta (um por vez) e os eventos dele
  abertoId = signal<string | null>(null);
  eventos = signal<PedidoEvento[]>([]);

  // Filtro da lista (os cards de contagem funcionam como botões de filtro)
  filtro = signal<Filtro>('todos');
  visiveis = computed(() => {
    const f = this.filtro();
    return f === 'todos' ? this.pedidos() : this.pedidos().filter(p => p.status === f);
  });

  // Contadores calculados automaticamente a partir da lista
  total = computed(() => this.pedidos().length);
  pendentes = computed(() => this.pedidos().filter(p => p.status === 'Pendente').length);
  aprovados = computed(() => this.pedidos().filter(p => p.status === 'PagamentoAprovado').length);
  recusados = computed(() => this.pedidos().filter(p => p.status === 'PagamentoRecusado').length);

  cliente = '';
  valor: number | null = null;

  ngOnInit() {
    this.carregar();
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizador));
  }

  carregar() {
    this.api.listar().subscribe({
      next: lista => {
        this.pedidos.set(lista);
        this.erro.set(null);

        // Se há uma linha do tempo aberta, atualiza ela junto
        const aberto = this.abertoId();
        if (aberto) this.carregarEventos(aberto);

        this.agendarProximaConsulta(lista);
      },
      error: () => {
        this.erro.set('Não foi possível falar com a API. Ela está rodando?');
        this.agendarProximaConsulta([]);
      }
    });
  }

  private carregarEventos(id: string) {
    this.api.listarEventos(id).subscribe({
      next: lista => {
        // Ignora a resposta se o usuário já fechou ou trocou de pedido
        if (this.abertoId() === id) this.eventos.set(lista);
      }
    });
  }

  // Continua consultando enquanto houver pedido pendente OU uma linha do tempo aberta
  private agendarProximaConsulta(lista: Pedido[]) {
    clearTimeout(this.temporizador);
    const continuar = lista.some(p => p.status === 'Pendente') || this.abertoId() !== null;

    this.acompanhando.set(continuar);
    if (continuar) {
      this.temporizador = setTimeout(() => this.carregar(), 2000);
    }
  }

  filtrar(filtro: Filtro) {
    this.filtro.set(filtro);
  }

  alternar(id: string) {
    if (this.abertoId() === id) {
      this.abertoId.set(null);
      this.eventos.set([]);
      return;
    }

    this.abertoId.set(id);
    this.eventos.set([]);
    this.carregar(); // busca a lista e os eventos e liga o acompanhamento
  }

    // Cada atalho gera um cliente e um valor novos, coerentes com o cenário
  preencher(cenario: Cenario) {
    const nome = `${sortear(NOMES)} ${sortear(SOBRENOMES)}`;

    switch (cenario) {
      case 'aprova': // abaixo do limite de R$ 5.000: o worker aprova
        this.cliente = nome;
        this.valor = valorAleatorio(60, 4900);
        break;
      case 'recusa': // acima do limite: o worker recusa
        this.cliente = nome;
        this.valor = valorAleatorio(5100, 25000);
        break;
      case 'instavel': // a marca no nome faz o worker simular um gateway instável
        this.cliente = `${nome} [instavel]`;
        this.valor = valorAleatorio(80, 1500);
        break;
      case 'falha': // a marca no nome faz o worker simular um gateway fora do ar
        this.cliente = `${nome} [falha]`;
        this.valor = valorAleatorio(80, 1500);
        break;
    }
  }

  criar() {
    if (!this.cliente.trim() || !this.valor || this.valor <= 0) return;

    this.enviando.set(true);
    this.api.criar({ cliente: this.cliente, valor: this.valor }).subscribe({
      next: () => {
        this.cliente = '';
        this.valor = null;
        this.enviando.set(false);
        this.carregar();
      },
      error: () => {
        this.erro.set('Erro ao criar o pedido.');
        this.enviando.set(false);
      }
    });
  }

  moeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  hora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR');
  }

  // Tempo decorrido desde o primeiro evento do pedido (ex.: +2,1s)
  deslocamento(e: PedidoEvento): string {
    const lista = this.eventos();
    if (lista.length === 0) return '';

    const inicio = new Date(lista[0].ocorridoEmUtc).getTime();
    const segundos = (new Date(e.ocorridoEmUtc).getTime() - inicio) / 1000;

    return '+' + segundos.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 's';
  }

  classeOrigem(origem: string): string {
    return origem.includes('Worker') ? 'origem worker' : 'origem api';
  }

  dicaOrigem(origem: string): string {
    return origem.includes('Worker')
      ? 'Payment.Worker: serviço separado que consome pedido.criado e processa o pagamento.'
      : 'Orders.Api: recebe o pedido, salva no Supabase e publica e consome mensagens no RabbitMQ.';
  }

  rotulo(status: StatusPedido): string {
    const nomes: Record<StatusPedido, string> = {
      Pendente: 'Processando',
      PagamentoAprovado: 'Aprovado',
      PagamentoRecusado: 'Recusado'
    };
    return nomes[status];
  }

  dicaStatus(status: StatusPedido): string {
    const dicas: Record<StatusPedido, string> = {
      Pendente: 'A mensagem está na fila ou o worker está processando o pagamento (inclui tentativas de retry).',
      PagamentoAprovado: 'O worker aprovou o pagamento e a API atualizou o pedido no banco.',
      PagamentoRecusado: 'O worker recusou o pagamento (no demo, valores acima de R$ 5.000).'
    };
    return dicas[status];
  }

  classe(status: StatusPedido): string {
    const classes: Record<StatusPedido, string> = {
      Pendente: 'badge pendente',
      PagamentoAprovado: 'badge aprovado',
      PagamentoRecusado: 'badge recusado'
    };
    return classes[status];
  }
}