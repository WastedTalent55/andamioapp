import { 
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '../../../core/config/google-maps.config';
import { AddressData } from '../../../core/models/address.model'; 

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [],
  templateUrl: './address-autocomplete.component.html',
  styleUrl: './address-autocomplete.component.css'
})
export class AddressAutocompleteComponent implements AfterViewInit{
  @ViewChild('addressInput')
  addressInput!: ElementRef<HTMLInputElement>;

  @Output()
  addressSelected = new EventEmitter<AddressData>();

  async ngAfterViewInit(): Promise<void> {

    setOptions({
      key: GOOGLE_MAPS_CONFIG.apiKey,
      v: 'weekly'
    });

    const { Autocomplete } = await importLibrary("places");
    const autocomplete = new Autocomplete(this.addressInput.nativeElement, {
      fields: ["address_components", "formatted_address", "geometry", "place_id"],
      componentRestrictions: { country: "mx" }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const components = place.address_components || [];
      const addressData: AddressData = {
      full_address: place.formatted_address as string,
      place_id: place.place_id as string,
      latitude: place.geometry.location?.lat() || 0,
      longitude: place.geometry.location?.lng() || 0,
      city: this.extractComponent(components, 'locality'),
      state: this.extractComponent(components, 'administrative_area_level_1'),
      postal_code: this.extractComponent(components, 'postal_code'),
      country: this.extractComponent(components, 'country')
    };

    this.addressSelected.emit(addressData);
    });
  }

  private extractComponent(components: any[], type: string): string {
  const component = components.find(c => c.types.includes(type));
  return component ? component.long_name : '';
  } 
}
  
  

