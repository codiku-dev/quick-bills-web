declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOCARDLESS_SECRET_ID: string;
      GOCARDLESS_SECRET_KEY: string;
      LMSTUDIO_URL: string;
      DATABASE_URL: string;
    }
  }
}

// This export is needed to make this a module
export { };
