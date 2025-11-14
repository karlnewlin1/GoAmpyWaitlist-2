import { Switch, Route } from 'wouter';
import { LandingPage } from '../pages/landing/LandingPage';
import { TourPage } from '../pages/tour/TourPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LoginPage } from '../pages/login/LoginPage';

export function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/tour" component={TourPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/login" component={LoginPage} />
    </Switch>
  );
}
