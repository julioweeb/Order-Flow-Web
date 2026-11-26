import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoApiService } from './pedido-api.service';
import { Pedido, StatusPedido } from './pedido.model';

@Component({
  selector: 'app-pedidos-page',
  imports: [FormsModule],
  template: `
    <header class="topo">
      <div class="topo-conteudo">
        <div class="logo">⚡</div>
        <div>
          <h1>OrderFlow</h1>
          <p>Pedidos assíncronos com .NET, RabbitMQ e Supabase</p>
        </div>
      </div>
    </header>

    <main>
      <section class="resumo">
        <div class="stat">
          <span class="stat-valor">{{ total() }}</span>
          <span class="stat-rotulo">Pedidos</span>
        </div>
        <div class="stat pendente">
          <span class="stat-valor">{{ pendentes() }}</span>
          <span class="stat-rotulo">Pendentes</span>
        </div>
        <div class="stat aprovado">
          <span class="stat-valor">{{ aprovados() }}</span>
          <span class="stat-rotulo">Aprovados</span>
        </div>
        <div class="stat recusado">
          <span class="stat-valor">{{ recusados() }}</span>
          <span class="stat-rotulo">Recusados</span>
        </div>
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
          <button type="submit" class="botao" [disabled]="enviando()">
            {{ enviando() ? 'Enviando...' : 'Criar pedido' }}
          </button>
        </form>

        <div class="atalhos">
          <span>Teste rápido:</span>
          <button type="button" class="atalho" (click)="preencher(150)">R$ 150 (aprova)</button>
          <button type="button" class="atalho" (click)="preencher(9000)">R$ 9.000 (recusa)</button>
        </div>

        @if (erro()) {
          <p class="erro">{{ erro() }}</p>
        }
      </section>

      <section class="painel">
        <h2>Pedidos recentes</h2>

        @if (pedidos().length === 0) {
          <p class="vazio">Nenhum pedido ainda. Crie o primeiro acima.</p>
        }

        @for (p of pedidos(); track p.id) {
          <article class="pedido">
            <div class="pedido-info">
              <strong>{{ p.cliente }}</strong>
              <span class="meta">{{ moeda(p.valor) }} · {{ hora(p.criadoEmUtc) }}</span>
              @if (p.motivoRecusa) {
                <span class="motivo">{{ p.motivoRecusa }}</span>
              }
            </div>
            <span [class]="classe(p.status)">
              <span class="ponto"></span>
              {{ rotulo(p.status) }}
            </span>
          </article>
        }
      </section>
    </main>
  `,
  styles: `
    :host { display: block; }

    .topo { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #fff; padding: 1.5rem 1rem; }
    .topo-conteudo { max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 0.9rem; }
    .logo { font-size: 1.8rem; background: rgba(255,255,255,0.15); width: 48px; height: 48px;
            display: grid; place-items: center; border-radius: 12px; }
    h1 { margin: 0; font-size: 1.5rem; }
    .topo p { margin: 0.15rem 0 0; opacity: 0.85; font-size: 0.9rem; }

    main { max-width: 720px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }

    .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
    .stat { background: var(--card); border: 1px solid var(--borda); border-radius: 12px;
            padding: 0.9rem; text-align: center; }
    .stat-valor { display: block; font-size: 1.7rem; font-weight: 700; }
    .stat-rotulo { font-size: 0.78rem; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.04em; }
    .stat.pendente .stat-valor { color: #b45309; }
    .stat.aprovado .stat-valor { color: #047857; }
    .stat.recusado .stat-valor { color: #b91c1c; }

    .painel { background: var(--card); border: 1px solid var(--borda); border-radius: 14px;
              padding: 1.1rem; margin-bottom: 1.25rem; }
    h2 { margin: 0 0 0.8rem; font-size: 1.05rem; }

    .formulario { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    input { flex: 1; min-width: 140px; padding: 0.65rem 0.75rem; border: 1px solid #d1d5db;
            border-radius: 8px; font-size: 0.95rem; }
    input:focus { outline: 2px solid #93c5fd; border-color: #2563eb; }
    .botao { padding: 0.65rem 1.2rem; border: 0; border-radius: 8px; background: #2563eb;
             color: #fff; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .botao:hover:not(:disabled) { background: #1d4ed8; }
    .botao:disabled { opacity: 0.6; cursor: not-allowed; }

    .atalhos { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.7rem;
               font-size: 0.85rem; color: var(--texto-suave); flex-wrap: wrap; }
    .atalho { border: 1px dashed #9ca3af; background: transparent; border-radius: 999px;
              padding: 0.25rem 0.75rem; cursor: pointer; font-size: 0.8rem; }
    .atalho:hover { background: #f3f4f6; }

    .erro { color: #b91c1c; margin: 0.8rem 0 0; font-size: 0.9rem; }
    .vazio { color: var(--texto-suave); margin: 0; }

    .pedido { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
              padding: 0.8rem 0; border-top: 1px solid var(--borda); animation: entrar 0.35s ease; }
    .pedido:first-of-type { border-top: 0; }
    .pedido-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .meta { color: var(--texto-suave); font-size: 0.85rem; }
    .motivo { color: #b91c1c; font-size: 0.8rem; }

    .badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.8rem;
             border-radius: 999px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;
             transition: background 0.4s, color 0.4s; }
    .ponto { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .badge.pendente { background: #fef3c7; color: #92400e; }
    .badge.pendente .ponto { animation: pulsar 1.1s infinite; }
    .badge.aprovado { background: #d1fae5; color: #065f46; }
    .badge.recusado { background: #fee2e2; color: #991b1b; }

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
        this.agendarProximaConsulta(lista);
      },
      error: () => {
        this.erro.set('Não foi possível falar com a API. Ela está rodando?');
        this.agendarProximaConsulta([]);
      }
    });
  }

  // Só continua consultando enquanto houver pedido pendente
  private agendarProximaConsulta(lista: Pedido[]) {
    clearTimeout(this.temporizador);
    if (lista.some(p => p.status === 'Pendente')) {
      this.temporizador = setTimeout(() => this.carregar(), 2000);
    }
  }

  // Preenche o formulário com um valor de teste (e um nome, se estiver vazio)
  preencher(valor: number) {
    this.valor = valor;
    if (!this.cliente.trim()) this.cliente = 'Cliente teste';
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

  rotulo(status: StatusPedido): string {
    const nomes: Record<StatusPedido, string> = {
      Pendente: 'Processando',
      PagamentoAprovado: 'Aprovado',
      PagamentoRecusado: 'Recusado'
    };
    return nomes[status];
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