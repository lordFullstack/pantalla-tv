# pantalla-tv — menú digital Pa'TOMAR · Pa'COMER

Menú animado para la pantalla de 55". No necesita internet ni instalación: es una página web.

## Cómo ponerlo en la TV
Abre `index.html` en Chrome a pantalla completa (tecla **F**), o en modo quiosco:

```
chrome --kiosk --autoplay-policy=no-user-gesture-required "file:///RUTA/pantalla-tv/index.html"
```

## Qué muestra y cuándo (cambia sola según la hora)
| Hora | Pantalla |
|---|---|
| 5:00 am – 3:30 pm | Avisa lo que viene: Club de Jugos, jugos desde las 3:30 pm, asados desde las 6:00 pm |
| 3:30 pm – 6:00 pm | Jugos, cócteles, Club, y cuenta regresiva para los asados |
| 6:00 pm – 9:30 pm | Menú completo (asados y barril primero) |
| 9:30 pm – 5:00 am | Cierre: Club y jugos del día siguiente |

## Qué editar
Todo está en `js/data.js`: precios, sabores, horarios, fotos, videos y el orden de las escenas.

- **Logo:** `assets/img/logo-comer.png` (PNG transparente). Pa'TOMAR se escribe junto al logo en las escenas de juguería.
- **Videos nuevos:** copia el .mp4 a `assets/video/` y agrégalo a la lista `videos`.

## Probar sin esperar la hora
`index.html?t=19:00` simula las 7 pm. `?scene=asados` muestra una escena. `?mode=noche|tarde|promo|cerrado` fuerza un momento.
Teclas: ← → cambian de escena, espacio pausa, 1-9 saltan, F pantalla completa.

## Escena gancho del Club
La escena `gancho` muestra en grande «¡Ganate un jugo gratis!» y los premios instantáneos. Los textos se editan en `club.hook` de `js/data.js`.
