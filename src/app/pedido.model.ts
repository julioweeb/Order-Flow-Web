export type StatusPedido = 'Pendente' | 'PagamentoAprovado' | 'PagamentoRecusado';

export interface Pedido {
  id: string;
  cliente: string;
  valor: number;
  status: StatusPedido;
  motivoRecusa: string | null;
  criadoEmUtc: string;
}

export interface CriarPedidoRequest {
  cliente: string;
  valor: number;
}