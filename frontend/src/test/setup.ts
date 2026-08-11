import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import '../i18n';

afterEach(() => {
  document.body.innerHTML = '';
});
