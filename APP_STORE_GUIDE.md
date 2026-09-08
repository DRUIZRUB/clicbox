# Guía de Publicación en Apple App Store Connect

Esta guía contiene la información y configuración requerida para publicar **ClickBox Importador** en [App Store Connect](https://appstoreconnect.apple.com/).

---

## 1. Ficha Técnica de la Aplicación

| Campo | Valor Configurado |
| :--- | :--- |
| **Nombre de la App** | ClickBox Importador *(o ClicBox)* |
| **Bundle ID (Host App)** | `com.mycompany.clicbox` |
| **Bundle ID (Extensión Safari)** | `com.mycompany.clicbox.Extension` |
| **SKU** | `TT353XSV23` |
| **Apple ID (App Store)** | `6758314176` |
| **Versión (Marketing Version)** | `1.1.0` |
| **Build inicial** | `1` |
| **Categoría Principal** | Utilidades (Utilities) o Productividad (Productivity) |
| **Categoría Secundaria** | Compras (Shopping) |

---

## 2. Textos para App Store Connect

### Nombre y Subtítulo
- **Nombre:** ClickBox Importador
- **Subtítulo (hasta 30 caracteres):** Importador de Catálogo y Peso

### Palabras Clave (Keywords - hasta 100 caracteres separados por coma)
```text
clickbox,importador,catalogo,sams club,amazon,walmart,peso,dimensiones,ecommerce,courier,logistica
```

### Descripción (Description)
```text
ClickBox Importador es la herramienta esencial para gestionar y sincronizar tu catálogo de productos directamente a tu panel de control de ClickBox.

Características principales:
• Importación con un solo clic: Captura información detallada de productos desde Sam's Club, Amazon, Walmart, Target, Costco, eBay y más.
• Extracción Inteligente: Detecta automáticamente título, precio, imágenes, SKU y código de producto.
• Cálculo Automático de Dimensiones y Peso: Estima y analiza peso bruto (lbs/kg), dimensiones (largo, ancho, alto) y volumen en pies cúbicos (ft³).
• Integración Directa: Envía los datos directamente a tu panel de administración de ClickBox para una cotización y gestión de flete inmediata.

Ahorra tiempo y elimina errores manuales en tu logística y catálogo de compras.
```

### Texto Promocional (Promotional Text - hasta 170 caracteres)
```text
Importa productos, precios, dimensiones y pesos de las principales tiendas a tu catálogo de ClickBox con un solo clic.
```

### URLs Requeridas por Apple
- **URL de Soporte (Support URL):** `https://clicbox-81bfc.web.app/`
- **URL de Política de Privacidad (Privacy Policy URL):** `https://clicbox-81bfc.web.app/privacidad` *(o la sección de políticas de tu dominio)*

---

## 3. Respuestas para la Declaración de Privacidad de la App (App Privacy)

En App Store Connect, Apple te solicitará responder sobre la recopilación de datos:
- **¿Tu app o tus socios recopilan datos de esta app?**
  - Selecciona: **No, no recopilamos datos** (Data Not Collected).
  - *Razón técnica:* La extensión únicamente lee el DOM de la página activa cuando el usuario pulsa el botón flotante para redirigir los parámetros a su propio panel privado de administración (`clicbox-81bfc.web.app`). No registra identificadores publicitarios, ni realiza seguimiento publicitario entre aplicaciones (*No tracking*).

---

## 4. Requisitos Gráficos y Assets

1. **Icono de App Store:**
   - Archivo generado: [`AppIcon-1024.png`](AppIcon-1024.png)
   - Dimensiones: 1024 × 1024 px.
   - Formato: PNG aplanado, espacio de color RGB, sin canal alfa/transparencia.
2. **Capturas de Pantalla (Screenshots):**
   - **macOS:** Mínimo 1 captura (recomendado 1280 × 800 o 2880 × 1800 px) mostrando la tienda con el botón flotante de ClickBox o el panel popup.
   - **iOS (iPhone) si se habilita para móviles:** Pantallas de 6.7" (1290 × 2796 px) o 6.5" (1242 × 2688 px).

---

## 5. Proceso de Generación y Subida de la Build (Binarios)

### Opción A: Automatizada vía GitHub Actions (Sin necesidad de Mac propia)
1. Al hacer `git push` a `main`, GitHub Actions ejecuta el workflow `.github/workflows/safari-extension.yml` en un servidor macOS con Xcode.
2. Al completarse la ejecución, dirígete a la pestaña **Actions** en tu repositorio:
   `https://github.com/DRUIZRUB/clicbox/actions`
3. Descarga el artefacto: `ClickBox-Safari-Xcode-Project.zip`.
4. Este zip contiene el proyecto nativo de Xcode listo y compilado.

### Opción B: Si tienes una Mac con Xcode
1. Clona el repositorio o descarga la carpeta.
2. Abre la terminal y ejecuta:
   ```bash
   chmod +x convert-safari.sh
   ./convert-safari.sh
   ```
3. Se abrirá el proyecto `ClickBox/ClickBox.xcodeproj` en Xcode.
4. En Xcode:
   - Selecciona el proyecto **ClickBox** en el navegador lateral.
   - Ve a la pestaña **Signing & Capabilities**.
   - En **Team**, selecciona tu cuenta de Apple Developer ( Dennis David Ruiz Rubio ).
   - Verifica los Bundle Identifiers:
     - App: `com.mycompany.clicbox`
     - Extension: `com.mycompany.clicbox.Extension`
   - Selecciona el destino **Any Mac (Apple Silicon, Intel)** o **Any iOS Device**.
   - Menú superior: **Product > Archive**.
   - Al finalizar el archivo, en el organizador haz clic en **Distribute App** > **App Store Connect** > **Upload**.
5. En unos 5 a 10 minutos, la build aparecerá disponible en [App Store Connect](https://appstoreconnect.apple.com/) bajo tu aplicación (`Apple ID: 6758314176`) para seleccionarla y enviar a revisión.
