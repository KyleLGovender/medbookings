declare module 'vcards-js' {
  interface VCard {
    firstName: string;
    lastName?: string;
    workPhone?: string;
    url?: string;
    getFormattedString(): string;
  }

  function vCards(): VCard;
  export = vCards;
}
