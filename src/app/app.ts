import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly now = signal(new Date());
  protected readonly year = computed(() => this.now().getFullYear());
}
