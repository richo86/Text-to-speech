import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { Signup } from './auth/signup/signup.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: Signup },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            // Add protected child routes here
            // Example: { path: 'dashboard', component: DashboardComponent }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
