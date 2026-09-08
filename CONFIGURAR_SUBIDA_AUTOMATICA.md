# Configuración de Subida Automática a App Store Connect

Esta guía explica cómo activar la subida **100% automática** para que cada vez que hagas `git push` a `main`, GitHub Actions compile, firme y envíe la build directamente a tu cuenta de [App Store Connect](https://appstoreconnect.apple.com/) sin que tengas que usar una Mac localmente.

---

## 🔑 Paso 1: Generar la Clave API de App Store Connect

Apple requiere una clave oficial (`.p8`) para que los sistemas automáticos puedan subir binarios a tu cuenta.

1. Ve a [App Store Connect > Integraciones > Claves de API](https://appstoreconnect.apple.com/access/integrations/api).
2. Haz clic en el botón azul **+** (Generar clave de API).
3. Configura:
   - **Nombre:** `GitHub Actions Auto Deploy`
   - **Acceso:** `App Manager` o `Administrador`
4. Haz clic en **Generar**.
5. Verás tres datos críticos:
   - **ID de Clave (Key ID):** (ejemplo: `2X9R4HXF34`)
   - **ID de Emisor (Issuer ID):** (ejemplo: `57246542-96fe-1a63-e053-0824d011072a`)
   - **Descargar clave de API:** Descarga el archivo `AuthKey_XXXXXXXXXX.p8`. *(Nota: Apple solo permite descargarlo una sola vez, guárdalo bien)*.

---

## 📜 Paso 2: Certificado de Distribución y Perfiles (Apple Developer)

Apple exige que todo binario enviado a la tienda esté firmado con un certificado oficial.

1. Ve a [developer.apple.com/account/resources/certificates/list](https://developer.apple.com/account/resources/certificates/list).
2. Crea o descarga tu certificado **Apple Distribution**.
3. Si lo generas en Mac o desde Keychain Access:
   - Exporta el certificado como archivo `.p12` (asígnale una contraseña que recuerdes).
4. Convierte el archivo `.p12` a texto base64 para guardarlo en GitHub:
   - En Windows (PowerShell):
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("ruta\a\tu\certificado.p12")) | Out-File -Encoding ascii cert_base64.txt
     ```
   - En macOS/Linux:
     ```bash
     base64 -i certificado.p12 | pbcopy
     ```

---

## ⚙️ Paso 3: Agregar los Secretos en GitHub

En tu repositorio de GitHub:
1. Ve a: [https://github.com/DRUIZRUB/clicbox/settings/secrets/actions](https://github.com/DRUIZRUB/clicbox/settings/secrets/actions)
2. Haz clic en **New repository secret** y agrega cada uno de los siguientes:

| Nombre del Secret en GitHub | Valor que debes pegar |
| :--- | :--- |
| `APP_STORE_CONNECT_KEY_ID` | El **Key ID** de 10 dígitos obtenido en el Paso 1. |
| `APP_STORE_CONNECT_ISSUER_ID` | El **Issuer ID** (UUID) obtenido en el Paso 1. |
| `APP_STORE_CONNECT_PRIVATE_KEY` | El contenido completo del archivo `.p8` (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`). |
| `BUILD_CERTIFICATE_BASE64` | La cadena base64 del certificado `.p12`. |
| `P12_PASSWORD` | La contraseña que le pusiste al exportar el `.p12`. |

---

## 🚀 ¡Listo! ¿Cómo funciona el envío automático?

Una vez guardados los secretos:
1. Cualquier cambio que hagas y subas con:
   ```bash
   git add .
   git commit -m "nuevos cambios"
   git push origin main
   ```
2. O desde la pestaña **Actions** en GitHub haciendo clic en **Run workflow**.
3. GitHub Actions automáticamente:
   - Conecta a un servidor macOS con Xcode.
   - Empaqueta y firma la extensión nativa de Safari con tu certificado.
   - Sube el paquete directamente a [App Store Connect](https://appstoreconnect.apple.com/) bajo tu **Apple ID `6758314176`**.
4. En unos minutos recibirás el correo de Apple avisando que la compilación ya está procesada en TestFlight y lista en App Store Connect.
