import { Plan } from '@/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

export interface GoogleEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

export const initGoogleApi = (onLoaded: () => void) => {
  if (typeof window === 'undefined') return;

  const script1 = document.createElement('script');
  script1.src = 'https://apis.google.com/js/api.js';
  script1.onload = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      if (gapiInited && gisInited) onLoaded();
    });
  };
  document.body.appendChild(script1);

  const script2 = document.createElement('script');
  script2.src = 'https://accounts.google.com/gsi/client';
  script2.onload = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined at request time
    });
    gisInited = true;
    if (gapiInited && gisInited) onLoaded();
  };
  document.body.appendChild(script2);
};

export const signIn = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          reject(resp);
        }
        localStorage.setItem('google_access_token', resp.access_token);
        localStorage.setItem('google_token_expiry', String(Date.now() + resp.expires_in * 1000));
        resolve(resp.access_token);
      };

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

export const signOutGoogle = () => {
  const token = localStorage.getItem('google_access_token');
  if (token) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
  if (window.gapi?.client) {
    window.gapi.client.setToken(null);
  }
};

export const getAccessToken = () => {
  const token = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('google_token_expiry');
  if (token && expiry && Date.now() < Number(expiry)) {
    return token;
  }
  return null;
};

export const listGoogleEvents = async (timeMin: string, timeMax: string): Promise<GoogleEvent[]> => {
  const token = getAccessToken();
  if (!token) return [];
  window.gapi.client.setToken({ access_token: token });
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.result.items || [];
  } catch (err) {
    console.error('Error listing Google events', err);
    return [];
  }
};

export const syncPlanToGoogle = async (plan: Plan): Promise<string | null> => {
  const token = getAccessToken();
  if (!token || !CLIENT_ID) return null;

  window.gapi.client.setToken({ access_token: token });

  const event: GoogleEvent = {
    summary: plan.item_name,
    description: `Target: Rp ${plan.amount}\n${plan.description}`,
    start: { date: plan.target_date },
    end: { date: plan.target_date }, // All day event
  };

  try {
    if (plan.google_event_id) {
      const response = await window.gapi.client.calendar.events.patch({
        calendarId: 'primary',
        eventId: plan.google_event_id,
        resource: event,
      });
      return response.result.id;
    } else {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      return response.result.id;
    }
  } catch (err) {
    console.error('Error syncing to Google Calendar', err);
    return null;
  }
};

export const deleteGoogleEvent = async (eventId: string) => {
  const token = getAccessToken();
  if (!token) return;
  window.gapi.client.setToken({ access_token: token });
  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (err) {
    console.error('Error deleting Google event', err);
  }
};

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
