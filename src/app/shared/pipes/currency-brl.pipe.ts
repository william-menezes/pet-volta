import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforma um valor inteiro em centavos para formato monetário brasileiro.
 * Exemplo: 50000 → "R$ 500,00"
 */
@Pipe({
  name: 'currencyBrl',
  standalone: true,
  pure: true,
})
export class CurrencyBrlPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    if (cents == null || isNaN(cents)) return 'R$ 0,00';
    const value = cents / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
