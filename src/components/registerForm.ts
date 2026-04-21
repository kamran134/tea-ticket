import { api } from '@/services/api';
import type { RegisterResult, Zone } from '@/types';

interface RegisterFormData {
  // URL param
  venueId: string;

  // Fields
  name: string;
  phone: string;
  selectedZoneId: string;

  // State
  zones: Zone[];
  zonesLoading: boolean;
  zonesError: string | null;
  loading: boolean;
  error: string | null;
  result: RegisterResult | null;

  init(): Promise<void>;
  selectedZone(): Zone | null;
  validate(): string | null;
  submit(): Promise<void>;
}

export function registerForm(): RegisterFormData {
  return {
    venueId: '',

    name: '',
    phone: '',
    selectedZoneId: '',

    zones: [],
    zonesLoading: false,
    zonesError: null,
    loading: false,
    error: null,
    result: null,

    async init() {
      const params = new URLSearchParams(window.location.search);
      this.venueId = params.get('venue') ?? '';

      if (!this.venueId) {
        this.zonesError = 'Ссылка недействительна: не указано мероприятие.';
        return;
      }

      this.zonesLoading = true;
      try {
        this.zones = await api.getZones(this.venueId);
        if (this.zones.length === 0) {
          this.zonesError = 'Для этого мероприятия нет доступных зон.';
        }
      } catch (err) {
        this.zonesError = err instanceof Error ? err.message : 'Ошибка загрузки зон';
      } finally {
        this.zonesLoading = false;
      }
    },

    selectedZone(): Zone | null {
      return this.zones.find(z => z.id === this.selectedZoneId) ?? null;
    },

    validate(): string | null {
      if (!this.name.trim()) return 'Введите имя и фамилию';
      if (!this.phone.trim()) return 'Введите номер телефона';
      if (!this.selectedZoneId) return 'Выберите зону';
      const zone = this.selectedZone();
      if (zone && zone.available <= 0) return 'В выбранной зоне нет свободных мест';
      return null;
    },

    async submit() {
      const validationError = this.validate();
      if (validationError) {
        this.error = validationError;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        this.result = await api.register({
          name: this.name.trim(),
          phone: this.phone.trim(),
          venueId: this.venueId,
          zoneId: this.selectedZoneId,
        });

        // Redirect to ticket page after successful booking
        window.location.href = `ticket.html?id=${this.result.id}`;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Произошла ошибка';
      } finally {
        this.loading = false;
      }
    },
  };
}
