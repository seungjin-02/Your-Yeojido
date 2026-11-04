import type {Region} from './types';
import {guidePlaces} from './travelGuides';
export const introductions:Record<string,string>={};
export const createPlaces=(regions:Region[])=>guidePlaces(regions);
