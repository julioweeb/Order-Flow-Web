import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoApiService } from './pedido-api.service';
import { Pedido, StatusPedido } from './pedido.model';

@Component({
  selector: 'app-pedidos-page',
  imports: [FormsModule],
  template: `
    <main>
      <h1>OrderFlow</h1>
      <p class="sub">Pedidos processados de forma assíncrona com RabbitMQ</p>

      <form class="card" (ngSubmit)="criar()">
        <input name="cliente" placeholder="Cliente" [(ngModel)]="cliente" required />
        <input
          name="valor"
          type="number"
          min="1"
          step="0.01"
          placeholder="Valor (R$)"
          [(ngModel)]="valor"
          required
        />
        <button type="submit" [disabled]="enviando()">
          {{ enviando() ? 'Enviando...' : 'Criar pedido' }}
        </button>
      </form>

      @if (erro()) {
        <p class="erro">{{ erro() }}</p>
      }

      <h2>Pedidos</h2>
      @if (pedidos().length === 0) {
        <p class="sub">Nenhum pedido ainda.</p>
      }

      @for (p of pedidos(); track p.id) {
        <div class="card linha">
          <div>
            <strong>{{ p.cliente }}</strong>
            <div class="sub">{{ moeda(p.valor) }} · {{ hora(p.criadoEmUtc) }}</div>
            @if (p.motivoRecusa) {
              <div class="motivo">{{ p.motivoRecusa }}</div>
            }
          </div>
          <span [class]="classe(p.status)">{{ rotulo(p.status) }}</span>
        </div>
      }
    </main>
  `,
  styles: `
    main { max-width: 640px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    h1 { margin-bottom: 0; }
    .sub { color: #6b7280; font-size: 0.9rem; }
    .card { display: flex; gap: 0.5rem; padding: 0.75rem; margin-bottom: 0.5rem;
            border: 1px solid #e5e7eb; border-radius: 8px; }
    .linha { justify-content: space-between; align-items: center; }
    input { flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; }
    button { padding: 0.5rem 1rem; border: 0; border-radius: 6px; background: #2563eb;
             color: #fff; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .pendente { background: #fef3c7; color: #92400e; }
    .aprovado { background: #d1fae5; color: #065f46; }
    .recusado { background: #fee2e2; color: #991b1b; }
    .motivo { color: #991b1b; font-size: 0.8rem; }
    .erro { color: #991b1b; }
  `
})
export class PedidosPage implements OnInit {
  private api = inject(PedidoApiService);
  private destroyRef = inject(DestroyRef);

  pedidos = signal<Pedido[]>([]);
  erro = signal<string | null>(null);
  enviando = signal(false);

  cliente = '';
  valor: number | null = null;

  private temporizador?: ReturnType<typeof setTimeout>;

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

  private agendarProximaConsulta(lista: Pedido[]) {
    clearTimeout(this.temporizador);
    const haPendente = lista.some(p => p.status === 'Pendente');

    if (haPendente) {
      this.temporizador = setTimeout(() => this.carregar(), 2000);
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

  rotulo(status: StatusPedido): string {
    const nomes: Record<StatusPedido, string> = {
      Pendente: 'Pendente',
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