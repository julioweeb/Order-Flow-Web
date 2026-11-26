import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CriarPedidoRequest, Pedido } from './pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoApiService {
  private http = inject(HttpClient);

  // Porta da Orders.Api (veja "Now listening on" no terminal da API)
  private readonly baseUrl = 'http://localhost:5134';

  listar(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/pedidos`);
  }

  criar(pedido: CriarPedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.baseUrl}/pedidos`, pedido);
  }
}