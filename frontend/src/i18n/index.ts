import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './pt-BR.json';
import ptBRConsoleTecnica from './pt-BR-console-tecnica.json';

const translation = {
  ...ptBR,
  consoleTecnica: {
    ...ptBR.consoleTecnica,
    ...ptBRConsoleTecnica.consoleTecnica,
  },
};

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': {
      translation,
    },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
