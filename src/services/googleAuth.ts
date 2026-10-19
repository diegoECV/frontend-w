// =============================================================================
// SERVICIO OFICIAL GOOGLE IDENTITY SERVICES (GIS OAuth 2.0) — VISONS S.A.C.
// =============================================================================

export interface GoogleUserData {
  email: string;
  name: string;
  avatar: string;
  sub: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Solicita autenticación real a través de la ventana oficial de Google
 */
export function requestGoogleAccount(): Promise<GoogleUserData> {
  return new Promise((resolve, reject) => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '423368558391-3ohp6nuvcg4t8aqqb8bpu1d1va9rblcp.apps.googleusercontent.com';

    if (typeof window === 'undefined') {
      reject(new Error('Entorno no compatible con navegador.'));
      return;
    }

    const checkGsiReady = (retries = 10) => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                reject(new Error(tokenResponse.error_description || tokenResponse.error));
                return;
              }

              if (tokenResponse.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  });

                  if (!res.ok) {
                    throw new Error('No se pudo consultar el perfil de Google.');
                  }

                  const data = await res.json();
                  resolve({
                    email: data.email,
                    name: data.name || data.email.split('@')[0],
                    avatar: data.picture || '',
                    sub: data.sub || '',
                  });
                } catch (fetchErr) {
                  reject(fetchErr);
                }
              } else {
                reject(new Error('No se obtuvo el token de autorización de Google.'));
              }
            },
          });

          // Solicita el token abriendo la ventana emergente oficial de Google
          client.requestAccessToken({ prompt: 'select_account' });
        } catch (err) {
          reject(err);
        }
      } else if (retries > 0) {
        setTimeout(() => checkGsiReady(retries - 1), 200);
      } else {
        reject(
          new Error(
            'El script de Google Identity no se ha cargado. Revisa tu conexión o bloqueador de anuncios.'
          )
        );
      }
    };

    checkGsiReady();
  });
}
