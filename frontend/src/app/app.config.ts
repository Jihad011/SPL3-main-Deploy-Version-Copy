import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { correlationIdInterceptor } from './core/interceptors/correlation-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    // Interceptor order matters: correlationId → jwt → error
    // correlationId runs first so all requests (including retries) have a trace header.
    provideHttpClient(withInterceptors([
      correlationIdInterceptor,  // 1st: tag every request with a trace ID
      jwtInterceptor,            // 2nd: attach Bearer token
      errorInterceptor           // 3rd: handle 4xx/5xx globally
    ])),
    provideAnimations(),
    provideCharts(withDefaultRegisterables())
  ]
};
