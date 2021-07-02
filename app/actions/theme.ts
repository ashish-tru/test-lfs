export enum ThemeTypeKeys {
  THEME_MODE = 'THEME_MODE',
  THEME_COLOR = 'THEME_COLOR',
}
interface GetThemeMode {
  type: typeof ThemeTypeKeys.THEME_MODE;
  payload: string;
}
interface GetThemeColor {
  type: typeof ThemeTypeKeys.THEME_COLOR;
  payload: string;
}
export type ThemeType = GetThemeMode | GetThemeColor;

export const getThemeMode = (payload: string) => {
  return {
    type: ThemeTypeKeys.THEME_MODE,
    payload,
  };
};
export const getThemeColor = (payload: string) => {
  return {
    type: ThemeTypeKeys.THEME_COLOR,
    payload,
  };
};

export default { getThemeMode, getThemeColor };
