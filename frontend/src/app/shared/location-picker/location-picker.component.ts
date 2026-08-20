import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string | null;
}

// Centre par défaut : Ouagadougou, Burkina Faso.
const DEFAULT_CENTER: [number, number] = [12.3686, -1.5275];
const DEFAULT_ZOOM = 12;
const PICKED_ZOOM = 16;

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './location-picker.component.html',
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly initialLocation = input<PickedLocation | null>(null);
  readonly readOnlyMode = input(false);
  readonly heightPx = input(280);

  readonly locationChange = output<PickedLocation | null>();

  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly locating = signal(false);
  readonly resolvingAddress = signal(false);
  readonly current = signal<PickedLocation | null>(null);
  readonly geolocationError = signal<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private marker: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private leaflet: any = null;

  constructor() {
    // Réagit aux changements de `initialLocation` survenant APRÈS le
    // premier rendu (ex : l'admin sélectionne une demande de projet dans
    // un menu déroulant une fois le composant déjà affiché). Le premier
    // rendu, lui, est géré directement dans ngAfterViewInit ci-dessous —
    // cet effect se contente d'ignorer les exécutions tant que la carte
    // n'est pas encore initialisée.
    effect(() => {
      const loc = this.initialLocation();
      if (!this.map || !this.leaflet) {
        return;
      }
      if (loc) {
        this.current.set(loc);
        this.placeMarker(loc.lat, loc.lng);
        this.map.setView([loc.lat, loc.lng], PICKED_ZOOM);
      } else {
        this.current.set(null);
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    // Import dynamique : Leaflet touche `window`/`document` dès son
    // chargement, ce qui casse le pré-rendu SSR si importé statiquement.
    const L = await import('leaflet');
    this.leaflet = L;

    const initial = this.initialLocation();
    const center: [number, number] = initial
      ? [initial.lat, initial.lng]
      : DEFAULT_CENTER;
    const zoom = initial ? PICKED_ZOOM : DEFAULT_ZOOM;

    this.map = L.map(this.mapContainer().nativeElement, {
      center,
      zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    if (initial) {
      this.current.set(initial);
      this.placeMarker(initial.lat, initial.lng);
    }

    if (!this.readOnlyMode()) {
      this.map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        this.selectPoint(e.latlng.lat, e.latlng.lng);
      });
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  useMyLocation(): void {
    if (!this.isBrowser || !navigator.geolocation) {
      this.geolocationError.set(
        "La géolocalisation n'est pas disponible sur cet appareil.",
      );
      return;
    }
    this.locating.set(true);
    this.geolocationError.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        this.selectPoint(pos.coords.latitude, pos.coords.longitude);
        this.map?.setView(
          [pos.coords.latitude, pos.coords.longitude],
          PICKED_ZOOM,
        );
      },
      () => {
        this.locating.set(false);
        this.geolocationError.set(
          "Impossible d'obtenir votre position. Placez le point manuellement sur la carte.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  onAddressInput(value: string): void {
    const c = this.current();
    if (!c) {
      return;
    }
    const updated = { ...c, address: value || null };
    this.current.set(updated);
    this.locationChange.emit(updated);
  }

  clear(): void {
    this.current.set(null);
    if (this.marker) {
      this.map?.removeLayer(this.marker);
      this.marker = null;
    }
    this.locationChange.emit(null);
  }

  private selectPoint(lat: number, lng: number): void {
    this.placeMarker(lat, lng);
    // On efface le libellé précédent : un nouveau point peut correspondre
    // à une tout autre adresse, le géocodage inverse ci-dessous la
    // renseignera dans l'instant qui suit.
    const picked: PickedLocation = { lat, lng, address: null };
    this.current.set(picked);
    this.locationChange.emit(picked);
    this.reverseGeocode(lat, lng);
  }

  private placeMarker(lat: number, lng: number): void {
    if (!this.map || !this.leaflet) {
      return;
    }
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    const pinIcon = this.leaflet.divIcon({
      className: 'location-picker-pin',
      html: `<svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#e7293d"/>
        <circle cx="12" cy="12" r="5" fill="#ffffff"/>
      </svg>`,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
    });

    this.marker = this.leaflet
      .marker([lat, lng], { icon: pinIcon, draggable: !this.readOnlyMode() })
      .addTo(this.map);

    if (!this.readOnlyMode()) {
      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.selectPoint(pos.lat, pos.lng);
      });
    }
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.resolvingAddress.set(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    )
      .then((res) => res.json())
      .then((data: { display_name?: string }) => {
        this.resolvingAddress.set(false);
        // On ne remplace que si le point n'a pas changé entre-temps et
        // qu'aucun libellé n'a déjà été saisi manuellement pendant la
        // résolution (course possible sur une connexion lente).
        const c = this.current();
        if (data?.display_name && c && c.lat === lat && c.lng === lng && !c.address) {
          const updated = { ...c, address: data.display_name };
          this.current.set(updated);
          this.locationChange.emit(updated);
        }
      })
      .catch(() => this.resolvingAddress.set(false));
  }
}
