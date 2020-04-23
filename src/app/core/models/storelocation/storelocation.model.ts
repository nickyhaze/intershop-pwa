import { LatLng } from '@agm/core';
import { Observable } from 'rxjs';

export interface StoreLocation {
  name: string;
  type?: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode?: string;
  email?: string;
  fax?: string;
  phoneBusiness?: string;
  uuid?: string;
  address: string;
  location$?: Observable<LatLng>;
}