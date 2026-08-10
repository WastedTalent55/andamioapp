import { Injectable } from '@angular/core';

declare const google: typeof google;

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {

  async loadPlacesLibrary() {
    //@ts-ignore
    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");

    return PlaceAutocompleteElement;
  }

}