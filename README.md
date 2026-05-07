# QualityCast PWA — Instrucciones de despliegue

## Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | App completa con soporte offline |
| `sw.js` | Service Worker (cache + offline) |
| `manifest.json` | Configuración PWA (ícono, nombre, color) |
| `icon-192.png` | Ícono para pantalla de inicio |
| `icon-512.png` | Ícono splash screen |

---

## Paso 1 — Configurar la URL del Apps Script

En `index.html`, línea ~180, buscá:

```javascript
const SCRIPT_URL = window.QC_SCRIPT_URL || "";
```

Reemplazá con la URL de tu web app:

```javascript
const SCRIPT_URL = "https://script.google.com/macros/s/TU_ID/exec";
```

La URL la encontrás en tu Apps Script:
**Desplegar → Administrar implementaciones → URL de la app web**

---

## Paso 2 — Publicar en GitHub Pages (gratis)

1. Creá un repositorio en GitHub (puede ser privado o público)
2. Subí los 5 archivos a la rama `main`
3. Andá a **Settings → Pages**
4. En "Source" seleccioná **Deploy from a branch → main → / (root)**
5. Guardá — en 2 minutos tu app estará en `https://TU_USUARIO.github.io/TU_REPO`

---

## Paso 3 — Actualizar el Apps Script (.gs)

El Apps Script actual funciona igual, solo necesitás agregar soporte CORS
para que la PWA externa pueda llamarlo. Reemplazá la función `doPost` (o
agregala si no existe) con esto:

```javascript
function doPost(e) {
  // Permitir CORS desde la PWA
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const payload = JSON.parse(e.postData.contents);
    const { funcName, args } = payload;

    let result;
    if (funcName === "ping")            result = ping();
    else if (funcName === "validarLegajo") result = validarLegajo(args[0]);
    else if (funcName === "guardarControl") result = guardarControl(args[0]);
    else result = { ok: false, error: "Función no encontrada" };

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.toString() }));
  }
  return output;
}
```

> **Nota:** Después de modificar el .gs, re-deployá la web app con
> **Desplegar → Nueva implementación** y actualizá la URL en `index.html`.

---

## Paso 4 — Instalar en el celular

### Android (Chrome)
1. Abrí la URL de GitHub Pages en Chrome
2. Tocá el menú ⋮ → "Agregar a pantalla de inicio"
3. Confirmá → ya aparece el ícono en el home

### iPhone (Safari)
1. Abrí la URL en Safari
2. Tocá el botón compartir □↑ → "Agregar a inicio"
3. Confirmá → ícono en el home

---

## Cómo funciona el offline

```
Sin conexión:
  Usuario completa formulario
    → datos van a IndexedDB (base de datos local del dispositivo)
    → pantalla "Guardado sin conexión" con ⏳

Al reconectarse:
  App detecta evento "online"
    → lee todos los registros de IndexedDB
    → los manda uno a uno al Apps Script
    → los borra de IndexedDB al confirmar
    → muestra badge "N pendientes" en la topbar
```

El operario también puede tocar el badge para sincronizar manualmente.

---

## Compatibilidad

| Dispositivo | Soporte |
|-------------|---------|
| Android Chrome 80+ | ✅ Completo |
| iPhone Safari 15+ | ✅ Completo |
| iPhone Safari 14 | ⚠️ Sin SW, pero funciona online |
| Desktop Chrome/Firefox | ✅ Completo |
