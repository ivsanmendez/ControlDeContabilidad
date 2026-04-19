# Feature 06 — Control de Acceso Vehicular

## Estado
**Design** — pendiente de implementación

---

## Problema

El fraccionamiento necesita vincular los controles de acceso vehicular (controles remotos conectados a brazos mecánicos vía tarjeta receptora en caseta) a las casas y, opcionalmente, a los vehículos que los utilizan.

El objetivo final es mantener un registro actualizado que permita **habilitar o inhabilitar físicamente los accesos** en función del estado de contribuciones de cada casa.

---

## Modelo de Dominio

### Entidades nuevas

#### `Casa`
Entidad raíz de este feature. Agrupa contribuyentes, controles de acceso y vehículos bajo un mismo predio.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | int64 | — | PK |
| `name` | string | ✅ | Identificador legible: "Casa 15", "Lote 7B" |
| `address` | string | — | Referencia opcional |
| `notes` | string | — | Observaciones internas |
| `created_at` | timestamp | — | |
| `updated_at` | timestamp | — | |

**Reglas:**
- Un nombre de casa es único dentro del fraccionamiento
- Una casa puede tener múltiples contribuyentes (dueño, arrendatario, familiar)
- Una casa puede tener entre 0 y 4 controles de acceso

---

#### `AccessControl` (Control de Acceso Vehicular)
Representa un control remoto físico asignado a una casa.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | int64 | — | PK |
| `casa_id` | int64 | ✅ | FK → casas |
| `code` | string | ✅ | Código físico impreso en el dispositivo |
| `admin_number` | string | ✅ | Número asignado por la administración (puede coincidir o no con `code`) |
| `status` | enum | ✅ | `active` \| `warning` \| `inactive` |
| `physical_synced_at` | timestamp | — | Última vez que la caseta aplicó el cambio físico. `NULL` = pendiente de configuración física |
| `notes` | string | — | Observaciones internas |
| `created_at` | timestamp | — | |
| `updated_at` | timestamp | — | |

**Reglas de negocio:**
- Máximo **4 controles** por casa (límite de seguridad)
- El control pertenece a la **casa**, no al vehículo — puede moverse entre vehículos
- `admin_number` es único globalmente (no puede existir dos controles con el mismo número)

**Estados:**

| Estado | Significado | ¿Físicamente funcional? |
|--------|-------------|------------------------|
| `active` | Al corriente en pagos | ✅ Sí |
| `warning` | 2 meses de adeudo — advertencia, plazo para ponerse al corriente | ✅ Sí (aún funcional) |
| `inactive` | 3+ meses de adeudo o inhabilitado manualmente | ❌ No |

**Transiciones de estado:**

```
active ──(2 meses adeudo)──► warning ──(1 mes más)──► inactive
active ◄──(admin manual)─────────────────────────────────────
warning ◄──(pago recibido)──────────────────────────────────
inactive ◄──(admin manual)──────────────────────────────────
inactive ──(pago al corriente)──► active
```

---

#### `Vehicle` (Vehículo) — registro opcional
Representa un vehículo que usa controles de acceso de la casa.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | int64 | — | PK |
| `casa_id` | int64 | ✅ | FK → casas |
| `plate` | string | ✅ | Placa |
| `color` | string | ✅ | Color |
| `brand` | string | — | Marca |
| `model` | string | — | Modelo |
| `notes` | string | — | Observaciones internas |
| `created_at` | timestamp | — | |
| `updated_at` | timestamp | — | |

---

#### `VehicleAccessControl` (tabla de unión) — muchos a muchos
Un vehículo puede tener múltiples controles asignados y un control puede estar asociado a múltiples vehículos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `vehicle_id` | int64 | FK → vehicles |
| `access_control_id` | int64 | FK → access_controls |
| `assigned_at` | timestamp | Cuándo se hizo la asignación |

---

### Modificación a entidades existentes

#### `Contributor` — agregar `casa_id`
Los contribuyentes existentes se vinculan a una casa. La relación es **muchos contribuyentes → una casa** (nullable inicialmente para no romper datos existentes).

| Campo nuevo | Tipo | Descripción |
|-------------|------|-------------|
| `casa_id` | int64? | FK nullable → casas. NULL = contribuyente sin casa asignada aún |

---

## Regla de Inhabilitación Automática

La evaluación se ejecuta periódicamente (o al registrar una contribución). Se calcula el **número de meses consecutivos sin contribución** para la casa.

| Meses sin pago | Acción del sistema |
|---|---|
| 0–1 | Sin acción |
| 2 | Todos los controles de la casa → `warning`. Se genera alerta para el administrador |
| 3+ | Todos los controles → `inactive`. Se marca `physical_synced_at = NULL` (pendiente configuración física) |
| Pago recibido (cualquier mes) | Todos los controles → `active`. Se marca `physical_synced_at = NULL` (pendiente re-habilitación física) |

**Override manual:** Un administrador puede cambiar el estado de cualquier control en cualquier momento, independientemente del estado de pagos.

---

## Acción Física en Caseta

La inhabilitación/habilitación requiere configurar físicamente la tarjeta receptora en la caseta de vigilancia. El sistema **no se comunica con hardware** — su rol es:

1. Registrar el estado lógico deseado
2. Mostrar un **panel de pendientes físicos** — controles cuyo `physical_synced_at` es `NULL` o anterior al último cambio de estado
3. El administrador/guardia aplica el cambio físico y marca el control como sincronizado → el sistema registra `physical_synced_at = NOW()`

---

## API Endpoints Propuestos

### Casas
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/casas` | Listar casas (con conteo de controles y estado de pagos) |
| `POST` | `/casas` | Crear casa |
| `GET` | `/casas/{id}` | Detalle: casa + contribuyentes + controles + vehículos |
| `PUT` | `/casas/{id}` | Editar casa |
| `DELETE` | `/casas/{id}` | Eliminar (solo si no tiene controles ni vehículos) |

### Controles de Acceso
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/casas/{id}/access-controls` | Listar controles de la casa |
| `POST` | `/casas/{id}/access-controls` | Asignar nuevo control (valida máx. 4) |
| `PUT` | `/access-controls/{id}` | Editar control (code, admin_number, notes) |
| `PUT` | `/access-controls/{id}/status` | Cambiar estado manualmente (enable/disable) |
| `PUT` | `/access-controls/{id}/sync` | Marcar como sincronizado físicamente |
| `DELETE` | `/access-controls/{id}` | Eliminar control |

### Vehículos
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/casas/{id}/vehicles` | Listar vehículos de la casa |
| `POST` | `/casas/{id}/vehicles` | Registrar vehículo |
| `PUT` | `/vehicles/{id}` | Editar vehículo |
| `DELETE` | `/vehicles/{id}` | Eliminar vehículo |
| `POST` | `/vehicles/{id}/access-controls/{control_id}` | Asignar control a vehículo |
| `DELETE` | `/vehicles/{id}/access-controls/{control_id}` | Desasignar control de vehículo |

### Panel de Administración
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/access-controls/pending-sync` | Controles con cambio de estado pendiente de configuración física |
| `POST` | `/access-controls/evaluate` | Disparar evaluación automática (admin only) |

---

## Migraciones de Base de Datos

```
014_create_casas.sql
015_create_access_controls.sql
016_create_vehicles.sql
017_create_vehicle_access_controls.sql
018_add_casa_id_to_contributors.sql
```

---

## Fases de Implementación

### Fase 1 — Casa + Vinculación de Contribuyentes
- Entidad `Casa` (domain + postgres + CRUD API)
- Migración + campo `casa_id` en `contributors`
- UI: página `/casas` con CRUD y asignación de contribuyentes

### Fase 2 — Controles de Acceso
- Entidad `AccessControl` (domain + postgres + CRUD API)
- Validación máx. 4 por casa
- Override manual enable/disable
- UI: sección de controles dentro del detalle de casa
- Panel de pendientes físicos

### Fase 3 — Vehículos (opcional)
- Entidad `Vehicle` + tabla de unión `VehicleAccessControl`
- CRUD API + UI dentro del detalle de casa
- Asignación/desasignación de controles a vehículos

### Fase 4 — Evaluación Automática
- Servicio de evaluación: calcular meses de adeudo por casa
- Transición automática de estados de controles
- Alertas (warning a 2 meses, inactive a 3 meses)
- Endpoint de evaluación manual + posibilidad de cron job futuro

---

## Permisos Necesarios (AAA)

| Permiso | Rol |
|---------|-----|
| `casa:create` | admin |
| `casa:read` | admin, user (solo su casa) |
| `casa:update` | admin |
| `casa:delete` | admin |
| `access_control:create` | admin |
| `access_control:read` | admin, user (solo su casa) |
| `access_control:update` | admin |
| `access_control:status` | admin |
| `access_control:sync` | admin |
| `vehicle:create` | admin, user (solo su casa) |
| `vehicle:read` | admin, user (solo su casa) |
| `vehicle:update` | admin, user (solo su casa) |
| `vehicle:delete` | admin, user (solo su casa) |

---

## Preguntas Abiertas

- ¿Los contribuyentes existentes se migrarán a casas en una operación batch, o se asignan manualmente desde la UI?
- ¿La evaluación automática se dispara al registrar una contribución, o es un job programado (cron)?
- ¿Se requiere historial de cambios de estado de controles para auditoría?
- ¿En el futuro habrá integración con hardware de la caseta (API, protocolo, etc.)?