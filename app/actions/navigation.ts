import {Location} from 'history';
export const ADD_LOCATION = 'ADD_LOCATION';
export const GO_BACK = 'GO_BACK';
export const GO_FORWARD = 'GO_FORWARD';
export const  CURRENT_LOCATION = 'CURRENT_LOCATION'

interface AddLocation {
  type: typeof ADD_LOCATION;
  payload: Location;
}

interface GoBack {
  type: typeof GO_BACK;
  payload: Location;
}

interface GoForward {
  type: typeof GO_FORWARD;
  payload: Location;
}

interface CurrentLocation {
  type : typeof CURRENT_LOCATION;
  payload :Location;
}

export type LocationType = AddLocation | GoBack | GoForward |CurrentLocation;

export const pushLocation = (payload: Location) => {
  return {
    type: ADD_LOCATION,
    payload,
  };
};

export const goBack = (payload: Location) => {
  return {
    type: GO_BACK,
    payload,
  };
};

export const goForward = (payload: Location) => {
  return {
    type: GO_FORWARD,
    payload,
  };
};

export const currentLocation = (payload:Location)=>{
  return {
    type :CURRENT_LOCATION,
    payload
  }
}

export default {
  pushLocation,
  goBack,
  goForward,
  currentLocation
};
