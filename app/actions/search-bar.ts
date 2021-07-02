import { IList } from '../utils/ListSchema';

export const GET_SEARCH_IN_LIST = 'GET_SEARCH_IN_LIST';
export const SELECTED_SEARCH = 'SELECTED_SEARCH';
export const FILTER_SEARCH_USING_VALUE = 'FILTER_SEARCH_USING_VALUE';

export const SearchFilter = {
  // LOCATION: 'LOCATION',
  LOCATION: 'LOCATION',
  PROJECT: 'WordPress' || 'Joomla' || 'Drupal', // || 'Magento',
};

interface GetAllSearchItem {
  type: typeof GET_SEARCH_IN_LIST;
  payload: IList[];
}
interface SelectedSearchItem {
  type: typeof SELECTED_SEARCH;
  payload: IList[];
}
interface FilterSearchItemsUsingValue {
  type: typeof FILTER_SEARCH_USING_VALUE;
  payload: string;
}

export type SearchBarType =
  | GetAllSearchItem
  | SelectedSearchItem
  | FilterSearchItemsUsingValue;

export const getAllSearchItem = (payload: IList[]) => {
  return { type: GET_SEARCH_IN_LIST, payload };
};

export const selectedSearchItem = (payload: IList[]) => {
  return { type: SELECTED_SEARCH, payload };
};

export const filterSearchUsingValue = (payload: string) => {
  return { type: FILTER_SEARCH_USING_VALUE, payload };
};

export default { getAllSearchItem, selectedSearchItem, filterSearchUsingValue };
