import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';
import { LOCALE_ID, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';

// 🐛 FIX: antes se registraba localeEs (genérico) pero LOCALE_ID pedía 'es-MX'
// específico — Angular exige que coincidan exacto, así que caía en el default
// en-US sin avisar (por eso salían fechas y moneda en formato gringo).
registerLocaleData(localeEsMx, 'es-MX');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),
    {
  provide: LOCALE_ID,
  useValue: 'es-MX'
},
    // 🆕 Sin esto, el pipe `currency` usa USD por default y muestra "US$"
    // en vez de "$" — independiente del LOCALE_ID (son tokens separados).
    {
  provide: DEFAULT_CURRENCY_CODE,
  useValue: 'MXN'
},
  ],
};