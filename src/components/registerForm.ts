import { api } from '@/services/api';
import type { RegisterResult } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface RegisterFormData {
  name: string;
  phone: string;
  zone: string;
  price: number | null;
  receiptFile: File | null;
  receiptPreview: string | null;

  loading: boolean;
  error: string | null;
  result: RegisterResult | null;

  init(): void;
  handleFileSelect(event: Event): void;
  removeFile(): void;
  validate(): string | null;
  submit(): Promise<void>;
}

export function registerForm(): RegisterFormData {
  return {
    name: '',
    phone: '',
    zone: '',
    price: null,
    receiptFile: null,
    receiptPreview: null,

    loading: false,
    error: null,
    result: null,

    init() {
      // Alpine lifecycle hook
    },

    handleFileSelect(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        this.error = 'Допустимые форматы: JPEG, PNG, WebP, PDF';
        input.value = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        this.error = 'Максимальный размер файла — 5 МБ';
        input.value = '';
        return;
      }

      this.error = null;
      this.receiptFile = file;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.receiptPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.receiptPreview = null;
      }
    },

    removeFile() {
      this.receiptFile = null;
      this.receiptPreview = null;
    },

    validate(): string | null {
      if (!this.name.trim()) return 'Введите имя';
      if (!this.phone.trim()) return 'Введите номер телефона';
      if (!this.zone.trim()) return 'Укажите зону';
      if (!this.price || this.price <= 0) return 'Укажите стоимость';
      if (!this.receiptFile) return 'Загрузите чек об оплате';
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
        let receiptBase64: string | undefined;
        let receiptFilename: string | undefined;

        if (this.receiptFile) {
          receiptBase64 = await fileToBase64(this.receiptFile);
          receiptFilename = this.receiptFile.name;
        }

        this.result = await api.register({
          name: this.name.trim(),
          phone: this.phone.trim(),
          zone: this.zone.trim(),
          price: this.price!,
          receiptBase64,
          receiptFilename,
        });
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Произошла ошибка';
      } finally {
        this.loading = false;
      }
    },
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}
