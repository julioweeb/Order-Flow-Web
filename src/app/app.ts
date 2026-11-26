import { Component, signal } from '@angular/core';
import { ComoFuncionaPage } from './como-funciona-page';
import { PedidosPage } from './pedidos-page';

@Component({
  selector: 'app-root',
  imports: [ComoFuncionaPage, PedidosPage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Aba aberta ao carregar a página (troque por 'pedidos' se preferir abrir direto na demo)
  aba = signal<'como-funciona' | 'pedidos'>('como-funciona');
}