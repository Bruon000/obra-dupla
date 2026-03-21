import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.canteiro.app',
  appName: 'Canteiro',
  webDir: 'dist',
  server: {
    // Em produção, o app carrega os arquivos locais (dist). Não use androidScheme a menos que precise.
  },
};

export default config;
