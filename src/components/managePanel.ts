import { api } from '@/services/api';
import type { Venue, Zone } from '@/types';

// Same hash as adminScanner — change both together if password changes
const ADMIN_PASSWORD_HASH = '413f07f6c18aee3ea6568595e1507352e506f0c0090a14a59e8b09cbede7639c';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Types ────────────────────────────────────

interface ZoneFormData {
  name: string;
  price: number | null;
  cardNumber: string;
  capacity: number | null;
  sortOrder: number;
}

interface VenueState {
  venue: Venue;
  zones: Zone[];
  zonesLoading: boolean;
  expanded: boolean;
  addingZone: boolean;
  zoneForm: ZoneFormData;
  editingZoneId: string | null;
}

interface ManagePanelData {
  // Auth
  authenticated: boolean;
  passwordInput: string;
  authError: string | null;

  // Venues
  venueStates: VenueState[];
  venuesLoading: boolean;
  venuesError: string | null;

  // Add venue form
  addingVenue: boolean;
  venueForm: { name: string; date: string };
  venueFormError: string | null;
  venueFormLoading: boolean;

  // Global feedback
  feedback: string | null;

  init(): void;
  checkPassword(): Promise<void>;
  loadVenues(): Promise<void>;
  loadZones(state: VenueState): Promise<void>;
  toggleExpand(state: VenueState): Promise<void>;
  submitVenue(): Promise<void>;
  submitAddZone(state: VenueState): Promise<void>;
  submitEditZone(state: VenueState): Promise<void>;
  startEditZone(state: VenueState, zone: Zone): void;
  cancelEditZone(state: VenueState): void;
  removeZone(state: VenueState, zoneId: string): Promise<void>;
  copyLink(venueId: string): void;
  showFeedback(msg: string): void;
}

// ── Default zone form ────────────────────────

function emptyZoneForm(): ZoneFormData {
  return { name: '', price: null, cardNumber: '', capacity: null, sortOrder: 0 };
}

// ── Component ────────────────────────────────

export function managePanel(): ManagePanelData {
  return {
    authenticated: false,
    passwordInput: '',
    authError: null,

    venueStates: [],
    venuesLoading: false,
    venuesError: null,

    addingVenue: false,
    venueForm: { name: '', date: '' },
    venueFormError: null,
    venueFormLoading: false,

    feedback: null,

    init() {
      // Nothing to load until authenticated
    },

    async checkPassword() {
      const hash = await sha256(this.passwordInput);
      if (hash === ADMIN_PASSWORD_HASH) {
        this.authenticated = true;
        this.authError = null;
        this.loadVenues();
      } else {
        this.authError = 'Неверный пароль';
      }
    },

    async loadVenues() {
      this.venuesLoading = true;
      this.venuesError = null;
      try {
        const venues = await api.getVenues();
        this.venueStates = venues.map(v => ({
          venue: v,
          zones: [],
          zonesLoading: false,
          expanded: false,
          addingZone: false,
          zoneForm: emptyZoneForm(),
          editingZoneId: null,
        }));
      } catch (err) {
        this.venuesError = err instanceof Error ? err.message : 'Ошибка загрузки';
      } finally {
        this.venuesLoading = false;
      }
    },

    async loadZones(state: VenueState) {
      state.zonesLoading = true;
      try {
        state.zones = await api.getZones(state.venue.id);
      } catch {
        // Non-critical
      } finally {
        state.zonesLoading = false;
      }
    },

    async toggleExpand(state: VenueState) {
      state.expanded = !state.expanded;
      if (state.expanded && state.zones.length === 0) {
        await this.loadZones(state);
      }
    },

    async submitVenue() {
      if (!this.venueForm.name.trim() || !this.venueForm.date.trim()) {
        this.venueFormError = 'Заполните название и дату';
        return;
      }
      this.venueFormLoading = true;
      this.venueFormError = null;
      try {
        const created = await api.createVenue({
          name: this.venueForm.name.trim(),
          date: this.venueForm.date.trim(),
        });
        this.venueStates.push({
          venue: created,
          zones: [],
          zonesLoading: false,
          expanded: false,
          addingZone: false,
          zoneForm: emptyZoneForm(),
          editingZoneId: null,
        });
        this.venueForm = { name: '', date: '' };
        this.addingVenue = false;
        this.showFeedback('Мероприятие создано');
      } catch (err) {
        this.venueFormError = err instanceof Error ? err.message : 'Ошибка создания';
      } finally {
        this.venueFormLoading = false;
      }
    },

    async submitAddZone(state: VenueState) {
      const f = state.zoneForm;
      if (!f.name.trim() || f.price === null || !f.cardNumber.trim() || f.capacity === null) {
        this.showFeedback('Заполните все обязательные поля зоны');
        return;
      }
      try {
        const created = await api.createZone({
          venueId: state.venue.id,
          name: f.name.trim(),
          price: f.price,
          cardNumber: f.cardNumber.trim(),
          capacity: f.capacity,
          sortOrder: f.sortOrder,
        });
        state.zones.push(created);
        state.zoneForm = emptyZoneForm();
        state.addingZone = false;
        this.showFeedback('Зона добавлена');
      } catch (err) {
        this.showFeedback(err instanceof Error ? err.message : 'Ошибка создания зоны');
      }
    },

    startEditZone(state: VenueState, zone: Zone) {
      state.editingZoneId = zone.id;
      state.zoneForm = {
        name: zone.name,
        price: zone.price,
        cardNumber: zone.cardNumber,
        capacity: zone.capacity,
        sortOrder: zone.sortOrder,
      };
    },

    cancelEditZone(state: VenueState) {
      state.editingZoneId = null;
      state.zoneForm = emptyZoneForm();
    },

    async submitEditZone(state: VenueState) {
      const f = state.zoneForm;
      if (!f.name.trim() || f.price === null || !f.cardNumber.trim() || f.capacity === null) {
        this.showFeedback('Заполните все обязательные поля зоны');
        return;
      }
      try {
        const updated = await api.updateZone({
          id: state.editingZoneId!,
          name: f.name.trim(),
          price: f.price,
          cardNumber: f.cardNumber.trim(),
          capacity: f.capacity,
          sortOrder: f.sortOrder,
        });
        const idx = state.zones.findIndex(z => z.id === state.editingZoneId);
        if (idx !== -1) state.zones[idx] = updated;
        state.editingZoneId = null;
        state.zoneForm = emptyZoneForm();
        this.showFeedback('Зона обновлена');
      } catch (err) {
        this.showFeedback(err instanceof Error ? err.message : 'Ошибка обновления зоны');
      }
    },

    async removeZone(state: VenueState, zoneId: string) {
      if (!confirm('Удалить зону? Это не удалит уже существующие билеты.')) return;
      try {
        await api.deleteZone(zoneId);
        state.zones = state.zones.filter(z => z.id !== zoneId);
        this.showFeedback('Зона удалена');
      } catch (err) {
        this.showFeedback(err instanceof Error ? err.message : 'Ошибка удаления зоны');
      }
    },

    copyLink(venueId: string) {
      const base = window.location.origin + window.location.pathname.replace('manage.html', '');
      const link = `${base}?venue=${venueId}`;
      navigator.clipboard.writeText(link);
      this.showFeedback('Ссылка скопирована');
    },

    showFeedback(msg: string) {
      this.feedback = msg;
      setTimeout(() => { this.feedback = null; }, 3000);
    },
  };
}
