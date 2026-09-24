import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { ConnectionsPage } from './pages/connections/connections';
import { DiscoverPage } from './pages/discover/discover';
import { LoginPage } from './pages/login/login';
import { RequestsPage } from './pages/requests/requests';
import { SignupPage } from './pages/signup/signup';
import { ShellComponent } from './shell/shell';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], component: LoginPage },
  { path: 'signup', canActivate: [guestGuard], component: SignupPage },
  {
    path: '',
    canActivate: [authGuard],
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'discover' },
      { path: 'discover', component: DiscoverPage },
      { path: 'requests', component: RequestsPage },
      { path: 'connections', component: ConnectionsPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
