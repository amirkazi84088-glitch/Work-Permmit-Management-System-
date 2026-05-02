import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar
        [collapsed]="false"
        (toggleCollapse)="sidebarCollapsed.set(false)"
      ></app-sidebar>
      <div class="shell-main">
        <app-header
          (toggleSidebar)="sidebarCollapsed.set(false)"
        ></app-header>
        <main class="shell-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      margin-left: var(--sidebar-width);
      transition: margin-left 0.3s ease;
    }

    .shell.sidebar-collapsed .shell-main {
      margin-left: var(--sidebar-collapsed-width);
    }

    .shell-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    @media (max-width: 768px) {
      .shell-main { margin-left: 0; }
      .shell.sidebar-collapsed .shell-main { margin-left: 0; }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
}
