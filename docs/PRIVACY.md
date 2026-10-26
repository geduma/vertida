# Aviso de privacidad — Vertida (BORRADOR)

> **Estado: borrador de trabajo, pendiente de revisión legal.** No afirmar cumplimiento de la Ley 1581 de 2012 ni de ninguna otra norma hasta que este texto sea revisado por un abogado. Los campos entre corchetes deben completarse antes de publicarlo.

## 1. Qué es Vertida

Vertida es una aplicación web de recetas y temporizador de café que funciona **íntegramente en el dispositivo del usuario**. No requiere cuenta, no tiene servidor propio y no envía información a un backend.

## 2. Qué información se guarda

Vertida **no recolecta datos de usuario**. Para funcionar, guarda en el almacenamiento local del navegador (`localStorage` e IndexedDB del propio dispositivo):

- **Preferencias de uso de la app:** idioma, tema, modo avanzado y silencio del temporizador.
- **Favoritos:** identificadores de las recetas que el usuario marca.
- **Recetas propias:** nombre, método, proporción, dosis y notas que el usuario decide crear y guardar.
- **Selección de equipos:** métodos de café que el usuario elige.

Estos datos no salen del dispositivo. No se escriben en ninguna base de datos externa, no se sincronizan en la nube y no se comparten con terceros.

## 3. Qué NO hace Vertida

- No crea cuentas ni perfiles de usuario.
- No usa analítica, cookies de seguimiento, publicidad ni identificadores publicitarios.
- No transmite datos a servidores propios ni de terceros.
- No vende, alquila ni cede información a terceros.
- No solicita datos personales como nombre, documento, dirección, teléfono o correo.

## 4. Finalidad

Los datos locales existen únicamente para que la app recuerde la configuración y el contenido que el usuario decidió guardar entre visitas. No se usan para perfilamiento ni para ninguna finalidad distinta.

## 5. Conservación y control del usuario

Los datos permanecen en el navegador hasta que el usuario:

- borre los datos del sitio desde la configuración del navegador, o
- desinstale la aplicación instalada (PWA).

Vertida no conserva copias fuera del dispositivo. Al borrar los datos del sitio se pierden preferencias, favoritos y recetas propias; esa acción es irreversible.

## 6. Derechos del titular

Como no hay recolección ni transmisión de datos personales por parte del responsable del producto, el usuario ejerce el control directamente sobre su navegador. Si en el futuro se añadiera cualquier tratamiento remoto, este aviso deberá actualizarse antes de su entrada en funcionamiento e incluir los canales para conocer, actualizar, rectificar y suprimir datos.

Contacto para asuntos de privacidad: **[CORREO DE CONTACTO]**

## 7. Seguridad

Vertida no transmite información, por lo que la exposición se limita al propio dispositivo del usuario. La app usa validación de esquema (Zod) y escapado de React, y no inserta HTML crudo. La seguridad física y el acceso al dispositivo dependen del usuario.

## 8. Menores de edad

Vertida no está dirigida a menores de edad ni recolecta datos de menores. No hay cuentas ni formularios que reciban información personal.

## 9. Cambios en este aviso

Si cambia el alcance de la app (por ejemplo, sincronización, cuentas o analítica), este documento deberá actualizarse y volver a revisarse antes de publicar el cambio. Última actualización del borrador: **2026-10-25**.

## 10. Responsable

**[RESPONSABLE DEL PRODUCTO / TITULAR]** · **[CIUDAD, PAÍS]** · **[CORREO DE CONTACTO]**

---

## English summary (not a legal document)

Vertida runs entirely on the user's device. It does **not collect user data** and has no backend, accounts, analytics, ads or third-party transfers. It stores only app preferences, favorites, the equipment selection and recipes the user chooses to create, in the browser's local storage. That information never leaves the device and can be removed by clearing site data or uninstalling the PWA. This summary is informational; the Spanish draft above is the document that requires legal review.
